import { Injectable } from '@nestjs/common';
import { RequestsService } from '../donations/services/requests.service';
import { DonorsService } from '../donations/services/donors.service';
import { BloodFilterDto } from './dtos/blood-filter.dto';
import { PaginationDto } from './dtos/pagination.dto';
import { Type as BloodType, Rh } from '../donations/entities/blood.entity';
import { BloodBag } from '../donations/entities/blood-bag.entity';
import { BloodBagsService } from '../donations/services/blood-bags.service';
import { TimeRangeDto } from './dtos/time-range.dto';
import { GroupBy, GroupByDto } from './dtos/group-by.dto';

@Injectable()
export class ReportsService {
    constructor(
        private readonly bloodBagsService: BloodBagsService,
        private readonly requestsService: RequestsService,
        private readonly donorsService: DonorsService,
    ) { }

    private inRange(d: Date, from?: string, to?: string) {
        const t = d?.getTime?.() ?? new Date(d).getTime();
        if (from && t < new Date(from).getTime()) return false;
        if (to && t > new Date(to).getTime()) return false;
        return true;
    }

    async inventoryByBlood({ from, to }: TimeRangeDto, { type, rh }: BloodFilterDto) {
        const bags = await this.bloodBagsService.findAll();
        const filtered = (bags ?? []).filter(b =>
            (!from && !to || this.inRange(b.donationDate, from, to)) &&
            (!type || b.blood.type === type) &&
            (!rh || b.blood.rh === rh),
        );

        const map = new Map<string, { type: BloodType; rh: Rh; units: number; bags: number }>();
        for (const bag of filtered) {
            const key = `${bag.blood.type}${bag.blood.rh}`;
            const curr = map.get(key) ?? { type: bag.blood.type, rh: bag.blood.rh, units: 0, bags: 0 };
            curr.units += bag.quantity;
            curr.bags += 1;
            map.set(key, curr);
        }
        return Array.from(map.values()).sort((a, b) => a.type.localeCompare(b.type));
    }

    async requestsFulfillment({ from, to }: TimeRangeDto, { limit, offset }: PaginationDto) {
        const reqs = await this.requestsService.findAll();
        const filtered = (reqs ?? []).filter(r => !from && !to || this.inRange(r.dateCreated, from, to));

        const bags = await this.bloodBagsService.findAll();
        const byRequest = new Map<number, BloodBag[]>();
        for (const bag of bags ?? []) {
            if (!bag.request) continue;
            if (from || to) {
                if (!this.inRange(bag.donationDate, from, to)) continue;
            }
            const arr = byRequest.get(bag.request.id) ?? [];
            arr.push(bag);
            byRequest.set(bag.request.id, arr);
        }

        const rows = filtered.map((r) => {
            const rBags = byRequest.get(r.id) ?? [];
            const delivered = rBags.reduce((acc, b) => acc + b.quantity, 0);
            const needed = r.quantityNeeded;
            const status = delivered >= needed ? 'FULFILLED' : delivered > 0 ? 'PARTIAL' : 'PENDING';
            const fulfillment = Math.min(100, Math.round((delivered / needed) * 100));
            return {
                requestId: r.id,
                blood: `${r.blood.type}${r.blood.rh}`,
                healthEntityId: r.healthEntity.id,
                createdAt: r.dateCreated,
                dueDate: r.dueDate,
                needed,
                delivered,
                fulfillment, // %
                status,
            };
        });

        rows.sort((a, b) => {
            const due = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            if (due !== 0) return due;
            return a.fulfillment - b.fulfillment;
        });

        const total = rows.length;
        return { total, limit, offset, items: rows.slice(offset, offset + limit) };
    }

    async overdueRequests(now = new Date()) {
        const reqs = await this.requestsService.findAll();
        const bags = await this.bloodBagsService.findAll();

        const deliveredByReq = new Map<number, number>();
        for (const b of bags ?? []) {
            if (!b.request) continue;
            deliveredByReq.set(b.request.id, (deliveredByReq.get(b.request.id) ?? 0) + b.quantity);
        }

        const items = (reqs ?? [])
            .filter(r => new Date(r.dueDate).getTime() < now.getTime())
            .map(r => {
                const delivered = deliveredByReq.get(r.id) ?? 0;
                const shortage = Math.max(0, r.quantityNeeded - delivered);
                return {
                    requestId: r.id,
                    healthEntity: r.healthEntity.name,
                    blood: `${r.blood.type}${r.blood.rh}`,
                    dueDate: r.dueDate,
                    needed: r.quantityNeeded,
                    delivered,
                    shortage,
                    status: delivered >= r.quantityNeeded ? 'FULFILLED_LATE' : 'OVERDUE',
                };
            })
            .filter(x => x.status === 'OVERDUE')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        return items;
    }

    async donorsActivity({ from, to }: TimeRangeDto) {
        const donors = await this.donorsService.findAll();
        const bags = await this.bloodBagsService.findAll();

        const byDonor = new Map<number, { donorId: number; name: string; document: string; donations: number; units: number }>();
        for (const donor of donors ?? []) {
            byDonor.set(donor.id, { donorId: donor.id, name: donor.name, document: donor.document, donations: 0, units: 0 });
        }
        for (const bag of bags ?? []) {
            if (from || to) {
                if (!this.inRange(bag.donationDate, from, to)) continue;
            }
            const d = bag.donor?.id ? byDonor.get(bag.donor.id) : undefined;
            if (d) {
                d.donations += 1;
                d.units += bag.quantity;
            }
        }

        return Array.from(byDonor.values()).sort((a, b) => b.units - a.units);
    }

    async healthEntitiesSummary({ from, to }: TimeRangeDto) {
        const reqs = await this.requestsService.findAll();
        const bags = await this.bloodBagsService.findAll();

        const byEntity = new Map<number, {
            healthEntityId: number; name: string;
            requests: number; unitsRequested: number;
            bagsReceived: number; unitsReceived: number;
            fulfillmentPct: number;
        }>();

        for (const r of reqs ?? []) {
            if (from || to) if (!this.inRange(r.dateCreated, from, to)) continue;
            const id = r.healthEntity.id;
            const curr = byEntity.get(id) ?? {
                healthEntityId: id, name: r.healthEntity.name,
                requests: 0, unitsRequested: 0, bagsReceived: 0, unitsReceived: 0, fulfillmentPct: 0,
            };
            curr.requests += 1;
            curr.unitsRequested += r.quantityNeeded;
            byEntity.set(id, curr);
        }

        for (const b of bags ?? []) {
            if (!b.request) continue;
            if (from || to) if (!this.inRange(b.donationDate, from, to)) continue;
            const id = b.request.healthEntity.id;
            const curr = byEntity.get(id);
            if (curr) {
                curr.bagsReceived += 1;
                curr.unitsReceived += b.quantity;
            }
        }

        for (const v of byEntity.values()) {
            v.fulfillmentPct = v.unitsRequested ? Math.min(100, Math.round((v.unitsReceived / v.unitsRequested) * 100)) : 0;
        }

        return Array.from(byEntity.values()).sort((a, b) => a.fulfillmentPct - b.fulfillmentPct);
    }


    async donationsByBlood(range: TimeRangeDto, gb: GroupByDto) {
        const bags = await this.bloodBagsService.findAll(); // ✅ usamos servicio del dominio
        const filtered = (bags ?? []).filter(b => this.inRange(b.donationDate, range.from, range.to));

        const dateKey = (d: Date) => {
            const dt = new Date(d);
            if (gb.groupBy === GroupBy.DAY) return dt.toISOString().slice(0, 10);          
            if (gb.groupBy === GroupBy.MONTH) return dt.toISOString().slice(0, 7);          
            return 'all';
        };

        type Row = {
            type: BloodType;
            rh: Rh;
            donations: number;
            units: number;
        };

        const map = new Map<string, Map<string, Row>>();

        for (const bag of filtered) {
            const fKey = dateKey(bag.donationDate);
            const bloodKey = `${bag.blood.type}${bag.blood.rh}`;
            if (!map.has(fKey)) map.set(fKey, new Map());
            const inner = map.get(fKey)!;

            const curr = inner.get(bloodKey) ?? {
                type: bag.blood.type,
                rh: bag.blood.rh,
                donations: 0,
                units: 0,
            };
            curr.donations += 1;         
            curr.units += bag.quantity;   
            inner.set(bloodKey, curr);
        }

        if (gb.groupBy === GroupBy.NONE) {
            const inner = map.get('all') ?? new Map<string, { type: BloodType; rh: Rh; donations: number; units: number }>();
            const values = Array.from(inner.values());
            return values.sort((a, b) => a.type.localeCompare(b.type));
        }

        const result = Array.from(map.entries())
            .map(([period, rows]) => ({
                period,
                items: Array.from(rows.values()).sort((a, b) => a.type.localeCompare(b.type)),
            }))
            .sort((a, b) => a.period.localeCompare(b.period));

        return result;
    }
}
