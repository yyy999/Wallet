import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'formatTimelineTime'
})
export class FormatTimelineTimePipe extends DatePipe implements PipeTransform {

  transform(value: Date, args?: any): any {
    if(value == void(0)){
      return null;
    }
    else{
      return super.transform(value, "HH:mm:ss");
    }
    
  }

}
