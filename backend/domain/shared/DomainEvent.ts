import { UniqueEntityId } from "./UniqueEntityId";

export interface IDomainEvent {
  dateTimeOccurred: Date;
  getAggregateId(): UniqueEntityId;
}

export type DomainEventCallback = (event: IDomainEvent) => void;

export class DomainEvents {
  private static handlersMap: Map<string, DomainEventCallback[]> = new Map();
  private static markedAggregates: any[] = [];

  public static register(callback: DomainEventCallback, eventClassName: string): void {
    if (!this.handlersMap.has(eventClassName)) {
      this.handlersMap.set(eventClassName, []);
    }
    this.handlersMap.get(eventClassName)!.push(callback);
  }

  public static clearHandlers(): void {
    this.handlersMap.clear();
  }

  public static clearMarkedAggregates(): void {
    this.markedAggregates = [];
  }

  public static markAggregateForDispatch(aggregate: any): void {
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);

    if (!aggregateFound) {
      this.markedAggregates.push(aggregate);
    }
  }

  private static findMarkedAggregateByID(id: UniqueEntityId): any {
    let found: any = null;
    for (const aggregate of this.markedAggregates) {
      if (aggregate.id.equals(id)) {
        found = aggregate;
        break;
      }
    }
    return found;
  }

  public static dispatchEventsForAggregate(id: UniqueEntityId): void {
    const aggregate = this.findMarkedAggregateByID(id);

    if (aggregate) {
      this.dispatchAggregateEvents(aggregate);
      aggregate.clearEvents();
      this.removeMarkedAggregate(aggregate);
    }
  }

  private static dispatchAggregateEvents(aggregate: any): void {
    aggregate.domainEvents.forEach((event: IDomainEvent) => this.dispatch(event));
  }

  private static removeMarkedAggregate(aggregate: any): void {
    const index = this.markedAggregates.findIndex((a) => a.id.equals(aggregate.id));
    if (index !== -1) {
      this.markedAggregates.splice(index, 1);
    }
  }

  private static dispatch(event: IDomainEvent): void {
    const eventClassName = event.constructor.name;

    if (this.handlersMap.has(eventClassName)) {
      const handlers = this.handlersMap.get(eventClassName)!;
      for (const handler of handlers) {
        handler(event);
      }
    }
  }
}
