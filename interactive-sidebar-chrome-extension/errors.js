export class MultipleInFlightGenerationsError extends Error {
  constructor(message) {
    super(message);
    this.message = "Multiple in-flight generations are not allowed.";
  }
}
