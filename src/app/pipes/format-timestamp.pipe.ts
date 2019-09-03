import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';

@Pipe({
  name: 'formatTimestamp'
})
export class FormatTimestampPipe implements PipeTransform {

  transform(value: Date, format?: Array<string>): any {
    if(value == void(0) || value.getFullYear() == 1){
      return null;
    }
    else{

      return moment(value).format('LL');
    }
    
  }

}

@Pipe({
  name: 'formatDateWithTime'
})
export class FormatDateWithTime extends DatePipe implements PipeTransform {

  transform(value: Date, args?: any): any {
    if(value == void(0) || value.getFullYear() == 1){
      return null;
    }
    else{
      let date:moment.Moment = moment(value);

      return date.format('LL') + ', ' + date.format('LTS');
    }
    
  }

}
