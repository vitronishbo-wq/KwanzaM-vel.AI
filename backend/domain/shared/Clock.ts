export class Clock {
  private static _mockDate: Date | null = null;

  public static now(): Date {
    if (this._mockDate) {
      return new Date(this._mockDate);
    }
    return new Date();
  }

  public static setMockDate(date: Date): void {
    this._mockDate = date;
  }

  public static clearMockDate(): void {
    this._mockDate = null;
  }
}
