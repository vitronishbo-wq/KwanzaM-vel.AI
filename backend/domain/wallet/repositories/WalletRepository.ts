import { Result } from "../../shared/Result";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { Wallet } from "../entities/Wallet";

export interface WalletDomainRepository {
  findById(id: UniqueEntityId): Promise<Result<Wallet>>;
  findByOwnerId(ownerId: UniqueEntityId): Promise<Result<Wallet>>;
  save(wallet: Wallet): Promise<Result<void>>;
}
