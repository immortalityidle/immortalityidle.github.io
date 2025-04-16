import { Pipe, PipeTransform } from '@angular/core';
import { MainLoopService } from './game-state/main-loop.service';

@Pipe({ name: 'floor' })
export class FloorPipe implements PipeTransform {
  /**
   *
   * @param value
   * @returns {number}
   */
  transform(value: number): number {
    return Math.floor(value);
  }
}

@Pipe({ name: 'camelToTitle' })
export class CamelToTitlePipe implements PipeTransform {
  /**
   *
   * @param value
   * @returns {string}
   */
  transform(value: string): string {
    value = value.split(/(?=[A-Z])/).join(' ');
    value = value[0].toUpperCase() + value.slice(1);
    return value;
  }
}

@Pipe({ name: 'bigNumber' })
export class BigNumberPipe implements PipeTransform {
  constructor(public mainLoopService: MainLoopService) {}

  /**
   *
   * @param value
   * @returns {string}
   */
  transform(value: number): string {
    if (!this.mainLoopService.scientificNotation) {
      let unsignedValue = value;
      let returnValue = '';
      if (value < 0) {
        unsignedValue = 0 - value;
      }
      const suffixArray = ['', 'k', 'M', 'B', 'T', 'q', 'Q', 's'];
      if (unsignedValue < 100 && !Number.isInteger(unsignedValue)) {
        returnValue = unsignedValue.toFixed(2) + '';
      } else if (unsignedValue < 10000) {
        returnValue = Math.round(unsignedValue) + '';
      } else if (unsignedValue >= Math.pow(10, suffixArray.length * 3)) {
        returnValue = unsignedValue.toPrecision(3);
      } else {
        const numberPower = Math.floor(Math.log10(unsignedValue));
        const numStr = Math.floor(unsignedValue / Math.pow(10, numberPower - (numberPower % 3) - 2)) / 100;
        returnValue = numStr + suffixArray[Math.floor(numberPower / 3)];
      }
      if (value < 0) {
        return '-' + returnValue;
      } else {
        return returnValue;
      }
    } else {
      return value.toPrecision(3);
    }
  }
}
