import { Component, OnInit, ViewChild, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { TimeRangeDescription } from './time-range-description';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-time-range-selector',
  templateUrl: './time-range-selector.component.html',
  styleUrls: ['./time-range-selector.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeRangeSelectorComponent),
      multi: true
    }
  ]
})
export class TimeRangeSelectorComponent implements OnInit, ControlValueAccessor {
  // tslint:disable-next-line:no-input-rename - for support reactive forms
  @Input('timeRangeValue') _timeRangeValue: Date[];
  @Output() timeRangeValueChange = new EventEmitter<Date[]>();
  @Input() predefinedRanges: TimeRangeDescription[];
  @ViewChild ('timerange') timeRangeElement: any;

  public expanded = false;
  private timeRange = 'hh:mm - hh:mm';
  private maxLength = 13;
  private inputPosition = 0;
  private fromHoursPosition = 0;
  private fromHoursPosition2 = 1;
  private fromHourseMinutesSeparatorPosition = 2;
  private fromMinutesPosition = 3;
  private toHoursPosition = 8;
  private toHoursPosition2 = 9;
  private toHourseMinutesSeparatorPosition = 10;
  private toMinutesPosition = 11;
  private enableLogging = false;

  get timeRangeValue() {
    return this._timeRangeValue;
  }

  set timeRangeValue(val) {
    this._timeRangeValue = val;
    this.onChange(val);
    this.onTouched();
    this.updateTimeRangePresentation ();
  }
  onChange: any = () => { }; // for support reactive forms
  onTouched: any = () => { }; // for support reactive forms

  constructor() { }

  // #region ControlValueAccessor implementation
  registerOnChange(fn) {
    this.onChange = fn;
  }

  registerOnTouched(fn) {
    this.onTouched = fn;
  }

  writeValue(value) {
    if (value) {
      this.timeRangeValue = value;
      this.updateTimeRangePresentation();
    }
  }
  // #endregion

  ngOnInit() {
    this.timeRange = this.getTimeRangeFromDatesArray();
    this.timeRangeElement.nativeElement.value = this.timeRange;
  }

  onKey(event: KeyboardEvent) {
    const textBox = (<HTMLInputElement>event.srcElement);
    const numberVal = Number.parseInt(event.key);
    let reverse = false;
    this.writeToConsole('Pressed: ' + event.key + '; input position: ' + this.inputPosition);
    let maxLengthModificatorFromKey = 0;
    if (event.key === 'ArrowLeft' || event.key === 'Backspace') {
      maxLengthModificatorFromKey = 1;
    }
    if (this.inputPosition < this.maxLength + maxLengthModificatorFromKey) {
      if (!isNaN(numberVal) && this.numberValueSatisfyPosition(numberVal)) {
        this.updateTimeRangeValue(numberVal);
        this.inputPosition ++;
        this.writeToConsole('After processing number input position is: ' + this.inputPosition);
      } else if (event.key === 'Backspace' && this.inputPosition > 0) {
        reverse = true;
        this.inputPosition--;
        this.adjustInputPosition (reverse);
        this.updateTimeRangeValue(0);
      } else if (event.key === 'ArrowLeft' && this.inputPosition > 0) {
        reverse = true;
        this.inputPosition--;
      } else if (event.key === 'Delete') {
        this.updateTimeRangeValue(0);
        this.inputPosition++;
      } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
        this.inputPosition++;
      }
    }
    this.adjustInputPosition (reverse);
    this.timeRangeElement.nativeElement.value = this.timeRange;
    textBox.selectionStart = this.inputPosition;
    textBox.selectionEnd = this.inputPosition + 1;
    this.updateBinding();
    this.writeToConsole('Before exiting method input position is: ' + this.inputPosition);
  }

  public onClick(event: MouseEvent) {
    const textBox = (<HTMLInputElement>event.srcElement);
    this.inputPosition = textBox.selectionStart;
    this.writeToConsole('On click input position is: ' + this.inputPosition);
  }

  toggleSelector() {
    this.expanded = !this.expanded;
  }

  predefinedRangeClick(range: number) {
    const dates = new Array<Date>();
    const dateFrom = new Date();
    dateFrom.setHours(dateFrom.getHours() - range);
    dates.push(dateFrom, new Date());
    this.timeRangeValue = dates;
    this.timeRange = this.getTimeRangeFromDatesArray();
    this.timeRangeElement.nativeElement.value = this.timeRange;
    this.expanded = false;
    this.updateBinding();
  }

  private getTimeRangeFromDatesArray (): string {
    let timeRange = 'hh:mm - hh:mm';
    if (this.timeRangeValue) {
      let firstHours = this.timeRangeValue[0].getHours().toString();
      if (firstHours.length < 2) {
        firstHours = '0' + firstHours;
      }
      let firstMinutes = this.timeRangeValue[0].getMinutes().toString();
      if (firstMinutes.length < 2) {
        firstMinutes = '0' + firstMinutes;
      }

      let secondHours = this.timeRangeValue[1].getHours().toString();
      if (secondHours.length < 2) {
        secondHours = '0' + secondHours;
      }
      let secondMinutes = this.timeRangeValue[1].getMinutes().toString();
      if (secondMinutes.length < 2) {
        secondMinutes = '0' + secondMinutes;
      }
      timeRange = firstHours + ':' + firstMinutes + ' - ' + secondHours + ':' + secondMinutes;
    }

    return timeRange;
  }

  private updateBinding () {
    const dates = new Array<Date>();
    const rangeParts = this.timeRange.split('-');
    for (let i = 0; i < 2; i++) {
      const timeParts = rangeParts[i].split(':');
      let hours = Number.parseInt(timeParts[0]);
      if (isNaN(hours)) {
        hours = 0;
      }
      let minutes = Number.parseInt(timeParts[1]);
      if (isNaN(minutes)) {
        minutes = 0;
      }
      dates.push(new Date(1900, 1, 1, hours, minutes));
    }
    this.timeRangeValue = dates;
    this.timeRangeValueChange.emit(this.timeRangeValue);
  }

  private numberValueSatisfyPosition (inputValue: number): boolean {
    let satisfy = true;
    if ((this.inputPosition === this.fromMinutesPosition || this.inputPosition === this.toMinutesPosition)
          && inputValue > 5) {
      satisfy = false; // minutes can not begins from number greater than 5
    }
    if (this.inputPosition === this.fromHoursPosition || this.inputPosition === this.toHoursPosition) {
      if (inputValue > 2) {
        satisfy = false; // hours can not begins from number greater than 2
      } else if (inputValue === 2) {
        const secondPartOfHours = Number.parseInt(this.timeRange[this.inputPosition]);
        if (secondPartOfHours > 3) {
          this.timeRangeReplaceCharAt(this.inputPosition, '3');
        }
      }
    }
    if (this.inputPosition === this.fromHoursPosition2 || this.inputPosition === this.toHoursPosition2) {
      const firstPartOfHours = Number.parseInt(this.timeRange[this.inputPosition - 1]);
      if (!isNaN(firstPartOfHours)) {
        if (firstPartOfHours > 1 && inputValue > 3) {
          satisfy = false; // hours can not be greater than 24
        }
      }
    }
    return satisfy;
  }

  private updateTimeRangeValue(inputValue: number) {
    this.timeRangeReplaceCharAt(this.inputPosition, inputValue.toString());
  }

  private adjustInputPosition (reverse = false) {
    const reverseModificator = reverse ? 2 : 0;
    if (this.inputPosition === this.fromHourseMinutesSeparatorPosition) {
      this.inputPosition = this.fromMinutesPosition - reverseModificator;
    }
    if (this.inputPosition > this.fromMinutesPosition + 1 && this.inputPosition < this.toHoursPosition) {
      this.inputPosition = reverse ? this.fromMinutesPosition + 1 : this.toHoursPosition;
    }
    if (this.inputPosition === this.toHourseMinutesSeparatorPosition) {
      this.inputPosition = this.toMinutesPosition - reverseModificator;
    }
  }

  private timeRangeReplaceCharAt (index: number, newValue: string) {
    this.timeRange = this.timeRange.substr(0, index) + newValue + this.timeRange.substr(index + newValue.length);
  }

  private updateTimeRangePresentation () {
    this.timeRange = this.getTimeRangeFromDatesArray();
    this.timeRangeElement.nativeElement.value = this.timeRange;
  }

  private writeToConsole (message: string) {
    if (this.enableLogging) {
      console.log(message);
    }
  }

}
