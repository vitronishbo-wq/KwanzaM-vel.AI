import { Result } from "../../shared/Result";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { UserIdentity } from "../entities/UserIdentity";
import { Nif } from "../value-objects/Nif";

export interface IdentityRepository {
  findById(id: UniqueEntityId): Promise<Result<UserIdentity>>;
  findByOwnerId(ownerId: UniqueEntityId): Promise<Result<UserIdentity>>;
  findByNif(nif: Nif): Promise<Result<UserIdentity>>;
  save(identity: UserIdentity): Promise<Result<void>>;
}
