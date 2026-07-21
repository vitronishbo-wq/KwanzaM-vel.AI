import { Result } from "../../shared/Result";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { Merchant } from "../entities/Merchant";

export interface MerchantDomainRepository {
  findById(id: UniqueEntityId): Promise<Result<Merchant>>;
  findByOwnerId(ownerId: UniqueEntityId): Promise<Result<Merchant>>;
  save(merchant: Merchant): Promise<Result<void>>;
}
