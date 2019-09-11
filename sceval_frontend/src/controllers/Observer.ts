import { Observable, Observer } from '../components/entities/API';

export class ConcreteObservable<T> implements Observable<T> {
  protected observers: Observer<T>[];
  
  constructor() {
    // define an array of observers
    this.observers = [];
  }
  /**
   * Method for adding a new observer to the observer set.
   * @param o 
   */
  addObserver(o: Observer<T>) {
    this.observers.push(o);
  }
  /**
   * Method for notifying all observers of a new websocket event.
   * @param obj 
   */
  notifyAll(obj: T) {
    for (const observer of this.observers) {
      try {
        observer.notify(obj);
      } catch (err) {
        console.error('Error while notifying observer: ', err);
      }
    }
  }
  /**
   * Method for removing an observer from the observer set on unmount.
   * @param obj 
   */
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
