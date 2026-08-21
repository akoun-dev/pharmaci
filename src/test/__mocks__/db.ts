/**
 * In-memory mock database for testing pharmacist API routes.
 * Implements the Prisma client interface with a simple store.
 */

type TableName = "user" | "pharmacy" | "medication" | "pharmacyMedication" | "order" | "orderItem" | "review" | "favorite" | "message" | "stockHistory";

interface MockRecord {
  id: string;
  [key: string]: unknown;
}

/**
 * Recursively check if a record field matches a Prisma-style where condition.
 * Handles: equality, { gt, gte, lt, lte }, { in: [...] }, { contains }, { equals }, date operators
 */
function matchesCondition(recordValue: unknown, condition: unknown): boolean {
  if (condition === null || condition === undefined) return recordValue === condition;
  if (condition instanceof Date) {
    const r = new Date(recordValue as string);
    return r.getTime() === condition.getTime();
  }
  if (typeof condition !== "object" || Array.isArray(condition)) {
    return recordValue === condition;
  }
  const cond = condition as Record<string, unknown>;
  // Object condition: every present operator must match (AND semantics, like Prisma)
  if ("equals" in cond) {
    if (recordValue !== cond.equals) return false;
  }
  if ("not" in cond) {
    if (recordValue === cond.not) return false;
  }
  if ("in" in cond && Array.isArray(cond.in)) {
    if (!cond.in.includes(recordValue)) return false;
  }
  if ("notIn" in cond && Array.isArray(cond.notIn)) {
    if (cond.notIn.includes(recordValue)) return false;
  }
  if ("gt" in cond) {
    const cmp = cond.gt instanceof Date ? cond.gt.getTime() : (cond.gt as number);
    const rv = cond.gt instanceof Date ? new Date(recordValue as string).getTime() : (recordValue as number);
    if (!(typeof rv === "number" && rv > cmp)) return false;
  }
  if ("gte" in cond) {
    const cmp = cond.gte instanceof Date ? cond.gte.getTime() : (cond.gte as number);
    const rv = cond.gte instanceof Date ? new Date(recordValue as string).getTime() : (recordValue as number);
    if (!(typeof rv === "number" && rv >= cmp)) return false;
  }
  if ("lt" in cond) {
    const cmp = cond.lt instanceof Date ? cond.lt.getTime() : (cond.lt as number);
    const rv = cond.lt instanceof Date ? new Date(recordValue as string).getTime() : (recordValue as number);
    if (!(typeof rv === "number" && rv < cmp)) return false;
  }
  if ("lte" in cond) {
    const cmp = cond.lte instanceof Date ? cond.lte.getTime() : (cond.lte as number);
    const rv = cond.lte instanceof Date ? new Date(recordValue as string).getTime() : (recordValue as number);
    if (!(typeof rv === "number" && rv <= cmp)) return false;
  }
  if ("contains" in cond && typeof cond.contains === "string") {
    if (!(typeof recordValue === "string" && recordValue.toLowerCase().includes(cond.contains.toLowerCase()))) {
      return false;
    }
  }
  // If the condition object had only operator keys we've already handled, it's a match.
  return true;
}

function filterRecords(records: MockRecord[], where?: Record<string, unknown>): MockRecord[] {
  if (!where) return records;
  return records.filter((r) =>
    Object.entries(where).every(([key, value]) => {
      // Prisma AND: { AND: [cond1, cond2, ...] }
      if (key === "AND" && Array.isArray(value)) {
        return (value as Record<string, unknown>[]).every((sub) =>
          Object.entries(sub).every(([k, v]) => matchesCondition(r[k], v))
        );
      }
      // Prisma OR: { OR: [...] }
      if (key === "OR" && Array.isArray(value)) {
        return (value as Record<string, unknown>[]).some((sub) =>
          Object.entries(sub).every(([k, v]) => matchesCondition(r[k], v))
        );
      }
      return matchesCondition(r[key], value);
    })
  );
}

/**
 * Project a record through a Prisma `select` (only the listed scalar fields).
 * `_count` selects are ignored (return empty counts) — add as needed.
 */
function projectSelect(record: MockRecord, select: Record<string, boolean>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(select)) {
    if (key in record) out[key] = record[key];
  }
  return out;
}

class MockStore {
  private data: Map<TableName, MockRecord[]> = new Map();

  constructor() {
    this.reset();
  }

  reset() {
    this.data = new Map();
    for (const table of ["user", "pharmacy", "medication", "pharmacyMedication", "order", "orderItem", "review", "favorite", "message", "stockHistory"] as TableName[]) {
      this.data.set(table, []);
    }
  }

  seed(table: TableName, records: MockRecord[]) {
    const existing = this.data.get(table) || [];
    this.data.set(table, [...existing, ...records]);
  }

  findAll(table: TableName): MockRecord[] {
    return this.data.get(table) || [];
  }

  findById(table: TableName, id: string): MockRecord | undefined {
    return (this.data.get(table) || []).find((r) => r.id === id);
  }

  findWhere(table: TableName, predicate: (record: MockRecord) => boolean): MockRecord[] {
    return (this.data.get(table) || []).filter(predicate);
  }

  findFirst(table: TableName, predicate: (record: MockRecord) => boolean): MockRecord | undefined {
    return (this.data.get(table) || []).find(predicate);
  }

  create(table: TableName, data: MockRecord): MockRecord {
    const store = this.data.get(table) || [];
    const record = { ...data, id: data.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` };
    store.push(record);
    this.data.set(table, store);
    return record;
  }

  count(table: TableName, predicate?: (record: MockRecord) => boolean): number {
    const records = this.data.get(table) || [];
    return predicate ? records.filter(predicate).length : records.length;
  }

  update(table: TableName, id: string, data: Partial<MockRecord>): MockRecord | null {
    const store = this.data.get(table) || [];
    const index = store.findIndex((r) => r.id === id);
    if (index === -1) return null;
    store[index] = applyUpdate(store[index], data);
    this.data.set(table, store);
    return store[index];
  }

  updateWhere(table: TableName, predicate: (record: MockRecord) => boolean, data: Partial<MockRecord>): number {
    const store = this.data.get(table) || [];
    let count = 0;
    for (let i = 0; i < store.length; i++) {
      if (predicate(store[i])) {
        store[i] = applyUpdate(store[i], data);
        count++;
      }
    }
    this.data.set(table, store);
    return count;
  }

  delete(table: TableName, id: string): boolean {
    const store = this.data.get(table) || [];
    const index = store.findIndex((r) => r.id === id);
    if (index === -1) return false;
    store.splice(index, 1);
    this.data.set(table, store);
    return true;
  }
}

/**
 * Apply a Prisma-style update payload to a record, handling the
 * { increment }, { decrement }, { set } field operators.
 */
function applyUpdate(record: MockRecord, data: Partial<MockRecord>): MockRecord {
  const out: MockRecord = { ...record };
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      const op = value as Record<string, number>;
      if ("increment" in op) {
        out[key] = ((record[key] as number) || 0) + (op.increment as number);
        continue;
      }
      if ("decrement" in op) {
        out[key] = ((record[key] as number) || 0) - (op.decrement as number);
        continue;
      }
      if ("set" in op) {
        out[key] = op.set as unknown;
        continue;
      }
    }
    out[key] = value;
  }
  return out;
}

export const mockStore = new MockStore();

function matchesWhere(record: MockRecord, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === "AND" || key === "OR") return true; // handled by filterRecords callers
    return matchesCondition(record[key], value);
  });
}

/** Resolve a user, optionally projecting through a nested `select`. */
function resolveUser(userId: string, opts?: { select?: Record<string, boolean>; }): Record<string, unknown> | null {
  const u = mockStore.findById("user", userId);
  if (!u) return null;
  if (opts?.select) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(opts.select)) if (k in u) out[k] = u[k];
    return out;
  }
  return u;
}

/** Enrich an order with its relations, mirroring Prisma `include` semantics. */
function enrichOrder(order: MockRecord, include: Record<string, unknown>): Record<string, unknown> {
  const enriched: Record<string, unknown> = { ...order };
  const want = (k: string) => k in include;
  if (want("items")) {
    const items = mockStore.findWhere("orderItem", (oi) => oi.orderId === order.id);
    const itemOpts = include.items as { include?: { medication?: { select?: Record<string, boolean> } } } | true | undefined;
    enriched.items = items.map((item) => {
      const med = mockStore.findById("medication", item.medicationId as string);
      const medSelect = itemOpts && typeof itemOpts === "object" ? itemOpts.include?.medication?.select : undefined;
      const medicationOut = medSelect && med ? projectSelect(med, medSelect) : (med || null);
      return { ...item, medication: medicationOut };
    });
  }
  if (want("user")) {
    const userOpts = include.user as { select?: Record<string, boolean> } | true | undefined;
    enriched.user = resolveUser(order.userId as string, typeof userOpts === "object" ? userOpts : undefined);
  }
  if (want("pharmacy")) {
    enriched.pharmacy = mockStore.findById("pharmacy", order.pharmacyId as string) || null;
  }
  return enriched;
}

// Mock Prisma client
export const db = {
  user: {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id) return mockStore.findById("user", where.id) || null;
      if (where.email) return mockStore.findFirst("user", (u) => u.email === where.email) || null;
      return null;
    },
    findFirst: async ({ where }: { where: Record<string, unknown> }) => {
      const users = filterRecords(mockStore.findAll("user"), where);
      return users[0] || null;
    },
    findMany: async ({ where, select, orderBy, skip, take }: { where?: Record<string, unknown>; select?: Record<string, boolean>; orderBy?: Record<string, string>; skip?: number; take?: number }) => {
      let records = filterRecords(mockStore.findAll("user"), where);
      if (orderBy) {
        const [field, dir] = Object.entries(orderBy)[0];
        records.sort((a, b) => {
          const va = a[field] as string | number;
          const vb = b[field] as string | number;
          if (typeof va === "string" && typeof vb === "string") {
            return dir === "desc" ? vb.localeCompare(va) : va.localeCompare(vb);
          }
          return dir === "desc" ? (vb as number) - (va as number) : (va as number) - (vb as number);
        });
      }
      if (skip) records = records.slice(skip);
      if (take) records = records.slice(0, take);
      if (select) {
        return records.map((r) => projectSelect(r, select));
      }
      return records;
    },
    count: async ({ where }: { where?: Record<string, unknown> }) => {
      return filterRecords(mockStore.findAll("user"), where).length;
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      return mockStore.create("user", data as MockRecord);
    },
    update: async ({ where, data, select }: { where: { id?: string; email?: string }; data: Record<string, unknown>; select?: Record<string, boolean> }) => {
      let record: MockRecord | null = null;
      if (where.id) record = mockStore.update("user", where.id, data);
      else if (where.email) {
        const u = mockStore.findFirst("user", (x) => x.email === where.email);
        if (u) record = mockStore.update("user", u.id, data);
      }
      if (record && select) return projectSelect(record, select);
      return record;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      mockStore.delete("user", where.id);
      return { id: where.id };
    },
  },
  pharmacy: {
    findUnique: async ({ where, select }: { where: { id?: string; ownerId?: string }; select?: Record<string, boolean> }) => {
      let result: MockRecord | undefined;
      if (where.id) result = mockStore.findById("pharmacy", where.id);
      if (where.ownerId) result = mockStore.findFirst("pharmacy", (p) => p.ownerId === where.ownerId);
      if (!result) return null;
      if (select) {
        const selected = projectSelect(result, select);
        if ("_count" in select) {
          selected._count = {
            medications: mockStore.count("pharmacyMedication", (pm) => pm.pharmacyId === result!.id),
            orders: mockStore.count("order", (o) => o.pharmacyId === result!.id),
            reviews: mockStore.count("review", (r) => r.pharmacyId === result!.id),
          };
        }
        return selected;
      }
      return result;
    },
    findFirst: async ({ where }: { where: Record<string, unknown> }) => {
      const pharmacies = filterRecords(mockStore.findAll("pharmacy"), where);
      return pharmacies[0] || null;
    },
    findMany: async ({ where, orderBy, skip, take, include }: { where?: Record<string, unknown>; orderBy?: Record<string, string>; skip?: number; take?: number; include?: Record<string, boolean> }) => {
      let records = filterRecords(mockStore.findAll("pharmacy"), where);
      if (orderBy) {
        const [field, dir] = Object.entries(orderBy)[0];
        records.sort((a, b) => {
          const va = a[field] as string | number;
          const vb = b[field] as string | number;
          if (typeof va === "string" && typeof vb === "string") {
            return dir === "desc" ? vb.localeCompare(va) : va.localeCompare(vb);
          }
          return dir === "desc" ? (vb as number) - (va as number) : (va as number) - (vb as number);
        });
      }
      if (skip) records = records.slice(skip);
      if (take) records = records.slice(0, take);
      if (include?.owner) {
        records = records.map((p) => ({ ...p, owner: mockStore.findById("user", p.ownerId as string) || null }));
      }
      return records;
    },
    count: async ({ where }: { where?: Record<string, unknown> }) => {
      return filterRecords(mockStore.findAll("pharmacy"), where).length;
    },
    update: async ({ where, data, select }: { where: { id: string }; data: Record<string, unknown>; select?: Record<string, boolean> }) => {
      const updated = mockStore.update("pharmacy", where.id, data);
      if (updated && select) return projectSelect(updated, select);
      return updated;
    },
  },
  medication: {
    findUnique: async ({ where, select }: { where: { id: string }; select?: Record<string, boolean> }) => {
      const result = mockStore.findById("medication", where.id);
      if (!result) return null;
      if (select) {
        const selected: Record<string, unknown> = {};
        for (const key of Object.keys(select)) {
          if (key in result) selected[key] = result[key];
        }
        return selected;
      }
      return result;
    },
    findFirst: async ({ where }: { where: { name?: { equals?: string } | { contains?: string } } }) => {
      const meds = mockStore.findAll("medication");
      const nameCondition = where.name;
      if (nameCondition) {
        if ("equals" in nameCondition && nameCondition.equals) {
          return meds.find((m) => m.name === nameCondition.equals) || null;
        }
        if ("contains" in nameCondition && nameCondition.contains) {
          return meds.find((m) => (m.name as string).includes(nameCondition.contains as string)) || null;
        }
      }
      return meds[0] || null;
    },
    findMany: async ({ where, select }: { where?: { name?: { contains?: string } }; select?: Record<string, boolean> }) => {
      let meds = mockStore.findAll("medication");
      if (where?.name?.contains) {
        const needle = where.name.contains;
        meds = meds.filter((m) => (m.name as string).includes(needle));
      }
      if (select) {
        return meds.map((m) => {
          const selected: Record<string, unknown> = {};
          for (const key of Object.keys(select)) {
            if (key in m) selected[key] = m[key];
          }
          return selected;
        });
      }
      return meds;
    },
  },
  pharmacyMedication: {
    findUnique: async ({ where, select }: { where: { id?: string; pharmacyId_medicationId?: { pharmacyId: string; medicationId: string } }; select?: Record<string, boolean> }) => {
      let result: MockRecord | undefined;
      if (where.id) result = mockStore.findById("pharmacyMedication", where.id);
      else if (where.pharmacyId_medicationId) {
        const { pharmacyId, medicationId } = where.pharmacyId_medicationId;
        result = mockStore.findFirst("pharmacyMedication", (pm) =>
          pm.pharmacyId === pharmacyId && pm.medicationId === medicationId
        );
      }
      if (!result) return null;
      if (select) return projectSelect(result, select);
      return result;
    },
    findMany: async ({ where, include, orderBy }: { where?: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string> }) => {
      let records = filterRecords(mockStore.findAll("pharmacyMedication"), where);
      if (include?.medication) {
        records = records.map((r) => {
          const mediationData = mockStore.findById("medication", r.medicationId as string);
          return { ...r, medication: mediationData || null };
        });
      }
      if (orderBy) {
        const [field, dir] = Object.entries(orderBy)[0];
        records.sort((a, b) => {
          let valA: unknown = a[field];
          let valB: unknown = b[field];
          if (field === "medication" && include?.medication) {
            const medA = (a as unknown as { medication: MockRecord }).medication;
            const medB = (b as unknown as { medication: MockRecord }).medication;
            valA = medA?.name || "";
            valB = medB?.name || "";
          }
          if (typeof valA === "string" && typeof valB === "string") {
            return dir === "desc" ? valB.localeCompare(valA) : valA.localeCompare(valB);
          }
          return dir === "desc"
            ? (valB as number) - (valA as number)
            : (valA as number) - (valB as number);
        });
      }
      return records;
    },
    count: async ({ where }: { where?: Record<string, unknown> }) => {
      const records = filterRecords(mockStore.findAll("pharmacyMedication"), where);
      return records.length;
    },
    create: async ({ data, include }: { data: Record<string, unknown>; include?: Record<string, boolean> }) => {
      const record = mockStore.create("pharmacyMedication", data as MockRecord);
      if (include?.medication) {
        const mediationData = mockStore.findById("medication", record.medicationId as string);
        return { ...record, medication: mediationData || null };
      }
      return record;
    },
    update: async ({ where, data, include }: { where: { id: string }; data: Record<string, unknown>; include?: Record<string, boolean> }) => {
      const updated = mockStore.update("pharmacyMedication", where.id, data);
      if (updated && include?.medication) {
        const mediationData = mockStore.findById("medication", updated.medicationId as string);
        return { ...updated, medication: mediationData || null };
      }
      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      return mockStore.delete("pharmacyMedication", where.id);
    },
  },
  order: {
    findUnique: async ({ where, include, select }: { where: { id?: string }; include?: Record<string, unknown>; select?: Record<string, boolean> }) => {
      const order = where.id ? mockStore.findById("order", where.id) : null;
      if (!order) return null;
      if (select) return projectSelect(order, select);
      if (include) return enrichOrder(order, include);
      return order;
    },
    findMany: async ({ where, include, orderBy, take, skip }: { where?: Record<string, unknown>; include?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number; skip?: number }) => {
      let records = filterRecords(mockStore.findAll("order"), where);
      if (orderBy) {
        const [field, dir] = Object.entries(orderBy)[0];
        records.sort((a, b) => {
          const valA = a[field] as number | string;
          const valB = b[field] as number | string;
          if (typeof valA === "string" || typeof valB === "string") {
            return dir === "desc"
              ? String(valB).localeCompare(String(valA))
              : String(valA).localeCompare(String(valB));
          }
          return dir === "desc" ? (valB as number) - (valA as number) : (valA as number) - (valB as number);
        });
      }
      if (skip) records = records.slice(skip);
      if (take) records = records.slice(0, take);
      if (include) records = records.map((o) => enrichOrder(o, include)) as MockRecord[];
      return records;
    },
    count: async ({ where }: { where?: Record<string, unknown> }) => {
      return filterRecords(mockStore.findAll("order"), where).length;
    },
    aggregate: async ({ where, _sum }: { where?: Record<string, unknown>; _sum?: { totalAmount?: boolean } }) => {
      const records = filterRecords(mockStore.findAll("order"), where);
      const fieldName = _sum ? Object.keys(_sum)[0] : "totalAmount";
      const sum = records.reduce((acc, r) => acc + ((r[fieldName] as number) || 0), 0);
      return { _sum: { [fieldName]: sum } as Record<string, number> };
    },
    create: async ({ data, include }: { data: Record<string, unknown>; include?: Record<string, unknown> }) => {
      // Support nested create: { ..., items: { create: [...] } }
      const { items: itemsInput, ...orderData } = data;
      const order = mockStore.create("order", orderData as MockRecord);
      if (itemsInput && typeof itemsInput === "object" && "create" in (itemsInput as Record<string, unknown>)) {
        const itemsToCreate = (itemsInput as { create: Record<string, unknown>[] }).create;
        for (const item of itemsToCreate) {
          mockStore.create("orderItem", { ...item, orderId: order.id } as unknown as MockRecord);
        }
      }
      if (include) return enrichOrder(order, include);
      return order;
    },
    update: async ({ where, data, include }: { where: { id: string }; data: Record<string, unknown>; include?: Record<string, unknown> }) => {
      const updated = mockStore.update("order", where.id, data);
      if (updated && include) return enrichOrder(updated, include);
      return updated;
    },
    updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      return mockStore.updateWhere("order", (o) => matchesWhere(o, where), data);
    },
  },
  stockHistory: {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      return mockStore.create("stockHistory", data as MockRecord);
    },
    findMany: async ({ where, orderBy, take }: { where?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number }) => {
      let records = filterRecords(mockStore.findAll("stockHistory"), where);
      if (orderBy) {
        const [field, dir] = Object.entries(orderBy)[0];
        records.sort((a, b) => {
          const valA = new Date(a[field] as string).getTime();
          const valB = new Date(b[field] as string).getTime();
          return dir === "desc" ? valB - valA : valA - valB;
        });
      }
      if (take) records = records.slice(0, take);
      return records;
    },
  },
  review: {
    count: async ({ where }: { where: Record<string, unknown> }) => {
      return filterRecords(mockStore.findAll("review"), where).length;
    },
    aggregate: async ({ where, _avg }: { where: Record<string, unknown>; _avg: { rating: boolean } }) => {
      const records = filterRecords(mockStore.findAll("review"), where);
      const fieldName = Object.keys(_avg)[0];
      const values = records.map((r) => (r[fieldName] as number) || 0);
      if (values.length === 0) return { _avg: { [fieldName]: null } as Record<string, number | null> };
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return { _avg: { [fieldName]: avg } as Record<string, number> };
    },
    create: async ({ data, include }: { data: Record<string, unknown>; include?: Record<string, boolean> }) => {
      const record = mockStore.create("review", data as MockRecord);
      if (include?.user) record.user = mockStore.findById("user", record.userId as string) || null;
      return record;
    },
    findMany: async ({ where, orderBy }: { where?: Record<string, unknown>; orderBy?: Record<string, string> }) => {
      const records = filterRecords(mockStore.findAll("review"), where);
      if (orderBy) {
        const [field, dir] = Object.entries(orderBy)[0];
        records.sort((a, b) => {
          const va = a[field] as number | string;
          const vb = b[field] as number | string;
          if (typeof va === "string" || typeof vb === "string") {
            return dir === "desc" ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb));
          }
          return dir === "desc" ? (vb as number) - (va as number) : (va as number) - (vb as number);
        });
      }
      return records;
    },
    deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
      const records = filterRecords(mockStore.findAll("review"), where);
      for (const r of records) mockStore.delete("review", r.id);
      return records.length;
    },
  },
  message: {
    create: async ({ data, include }: { data: Record<string, unknown>; include?: Record<string, boolean> }) => {
      const record = mockStore.create("message", data as MockRecord);
      if (include?.sender) record.sender = mockStore.findById("user", record.senderId as string) || null;
      if (include?.receiver) record.receiver = mockStore.findById("user", record.receiverId as string) || null;
      return record;
    },
    findMany: async ({ where, orderBy, include }: { where: Record<string, unknown>; orderBy?: Record<string, string>; include?: Record<string, boolean> }) => {
      let records = filterRecords(mockStore.findAll("message"), where);
      if (orderBy) {
        const [field, dir] = Object.entries(orderBy)[0];
        records.sort((a, b) => {
          const va = new Date(a[field] as string).getTime();
          const vb = new Date(b[field] as string).getTime();
          return dir === "desc" ? vb - va : va - vb;
        });
      }
      if (include) {
        records = records.map((m) => {
          const out: MockRecord = { ...m };
          if (include.sender) out.sender = mockStore.findById("user", m.senderId as string) || null;
          if (include.receiver) out.receiver = mockStore.findById("user", m.receiverId as string) || null;
          return out;
        });
      }
      return records;
    },
    updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      return mockStore.updateWhere("message", (m) => matchesWhere(m, where), data);
    },
  },
  favorite: {
    findMany: async ({ where, include }: { where?: Record<string, unknown>; include?: Record<string, boolean> }) => {
      let records = filterRecords(mockStore.findAll("favorite"), where);
      if (include?.pharmacy) {
        records = records.map((f) => ({ ...f, pharmacy: mockStore.findById("pharmacy", f.pharmacyId as string) || null }));
      }
      return records;
    },
    findUnique: async ({ where }: { where: { userId_pharmacyId?: { userId: string; pharmacyId: string } } }) => {
      if (where.userId_pharmacyId) {
        const { userId, pharmacyId } = where.userId_pharmacyId;
        return mockStore.findFirst("favorite", (f) => f.userId === userId && f.pharmacyId === pharmacyId) || null;
      }
      return null;
    },
    create: async ({ data }: { data: Record<string, unknown> }) => mockStore.create("favorite", data as MockRecord),
    delete: async ({ where }: { where: { userId_pharmacyId: { userId: string; pharmacyId: string } } }) => {
      const { userId, pharmacyId } = where.userId_pharmacyId;
      const f = mockStore.findFirst("favorite", (x) => x.userId === userId && x.pharmacyId === pharmacyId);
      if (f) { mockStore.delete("favorite", f.id); return f; }
      return null;
    },
  },
  // Prisma transactions: support both callback form (used by orders route) and
  // sequential array form. The callback reuses the same in-memory client.
  $transaction: async <T,>(
    fnOrArray: ((tx: Record<string, unknown>) => Promise<T>) | Promise<unknown>[]
  ): Promise<T> => {
    if (Array.isArray(fnOrArray)) {
      const results: unknown[] = [];
      for (const p of fnOrArray) results.push(await p);
      return results as unknown as T;
    }
    return (fnOrArray as (tx: Record<string, unknown>) => Promise<T>)(db);
  },
} as Record<string, unknown>;

export function seedTestData() {
  mockStore.reset();

  mockStore.create("user", {
    id: "pharmacist-1",
    email: "pharmacist@test.com",
    name: "Dr. Pharmacien",
    role: "PHARMACIST",
    phone: "0102030405",
  });
  mockStore.create("user", {
    id: "patient-1",
    email: "patient@test.com",
    name: "Patient Test",
    role: "PATIENT",
    phone: null,
  });
  mockStore.create("user", {
    id: "patient-2",
    email: "patient2@test.com",
    name: "Patient Deux",
    role: "PATIENT",
    phone: null,
  });

  mockStore.create("pharmacy", {
    id: "pharmacy-1",
    name: "Pharmacie Centrale",
    ownerId: "pharmacist-1",
    address: "20 Rue de la Santé",
    city: "Abidjan",
    district: "Plateau",
    latitude: 5.36,
    longitude: -4.02,
    phone: "0102030405",
    email: "contact@pharmacie-centrale.ci",
    openingTime: "08:00",
    closingTime: "20:00",
    isOpen24h: false,
    isOnGuard: false,
    isVerified: true,
    rating: 4.5,
    reviewCount: 10,
    services: "vaccination,conseil,livraison",
    payments: "mobile_money,cash,card",
    imageUrl: null,
  });

  mockStore.create("medication", {
    id: "med-1",
    name: "Paracétamol",
    activeIngredient: "Paracétamol",
    category: "Antalgiques",
    dosage: "500mg",
    form: "Comprimé",
    description: "Antidouleur",
    prescriptionRequired: false,
  });
  mockStore.create("medication", {
    id: "med-2",
    name: "Amoxicilline",
    activeIngredient: "Amoxicilline",
    category: "Antibiotiques",
    dosage: "250mg",
    form: "Gélule",
    description: "Antibiotique",
    prescriptionRequired: true,
  });
  mockStore.create("medication", {
    id: "med-3",
    name: "Ibuprofène",
    activeIngredient: "Ibuprofène",
    category: "Antalgiques",
    dosage: "400mg",
    form: "Comprimé",
    description: "Anti-inflammatoire",
    prescriptionRequired: false,
  });
  // 4th medication not added to stock (for POST test that expects 201)
  mockStore.create("medication", {
    id: "med-4",
    name: "Doliprane",
    activeIngredient: "Paracétamol",
    category: "Antalgiques",
    dosage: "1000mg",
    form: "Comprimé",
    description: "Antidouleur",
    prescriptionRequired: false,
  });

  mockStore.create("pharmacyMedication", {
    id: "stock-1",
    pharmacyId: "pharmacy-1",
    medicationId: "med-1",
    price: 2500,
    stock: 50,
    lowStockThreshold: 10,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  });
  mockStore.create("pharmacyMedication", {
    id: "stock-2",
    pharmacyId: "pharmacy-1",
    medicationId: "med-2",
    price: 3500,
    stock: 5,
    lowStockThreshold: 10,
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  });
  mockStore.create("pharmacyMedication", {
    id: "stock-3",
    pharmacyId: "pharmacy-1",
    medicationId: "med-3",
    price: 3000,
    stock: 0,
    lowStockThreshold: 5,
    expiryDate: null,
  });

  mockStore.create("order", {
    id: "order-1",
    code: "PHARMACI-ABC123",
    userId: "patient-1",
    pharmacyId: "pharmacy-1",
    status: "PENDING",
    totalAmount: 5000,
    notes: null,
  });
  mockStore.create("order", {
    id: "order-2",
    code: "PHARMACI-DEF456",
    userId: "patient-2",
    pharmacyId: "pharmacy-1",
    status: "CONFIRMED",
    totalAmount: 7500,
    notes: "Urgent",
  });

  mockStore.create("review", {
    id: "review-1",
    userId: "patient-1",
    pharmacyId: "pharmacy-1",
    rating: 5,
    comment: "Excellent service",
  });

  mockStore.create("stockHistory", {
    id: "sh-1",
    pharmacyId: "pharmacy-1",
    medicationId: "med-1",
    changeType: "ADD",
    quantity: 50,
    note: "Ajout initial en stock",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

export function __resetDb() {
  mockStore.reset();
}
