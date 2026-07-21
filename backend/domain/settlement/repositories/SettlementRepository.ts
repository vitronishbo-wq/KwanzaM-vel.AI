import { Result } from "../../shared/Result";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { SettlementBatch } from "../entities/SettlementBatch";

export interface SettlementDomainRepository {
  findById(id: UniqueEntityId): Promise<Result<SettlementBatch>>;
  save(batch: SettlementBatch): Promise<Result<void>>;
  findLatest(): Promise<Result<SettlementBatch | null>>;
}
