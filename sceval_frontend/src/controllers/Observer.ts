import { Observable, Observer } from '../components/entities/API';

export class ConcreteObservable<T> implements Observable<T> {
  protected observers: Observer<T>[];

  constructor() {
    this.observers = [];
  }

  addObserver(o: Observer<T>) {
    this.observers.push(o);
  }

  notifyAll(obj: T) {
    for (const observer of this.observers) {
      try {
        observer.notify(obj);
      } catch (err) {
        console.error('Error while notifying observer: ', err);
      }
    }
  }

  removeObserver(obj: Observer<T>): Observer<T> | null {
    for (let x = 0; x < this.observers.length; ++x) {
      if (obj === this.observers[x]) {
        return this.observers.splice(x, 1)[0];
      }
    }

    return null;
  }
}

export default Observer;