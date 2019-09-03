import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'formatTimelineDate'
})
export class FormatTimelineDatePipe extends DatePipe implements PipeTransform {

  transform(value: Date, args?: any): any {
    if(value == void(0)){
      return null;
    }
    else{
      return super.transform(value, "MMM dd, yyyy");
    }
    
  }

}
