import { Component, OnInit } from '@angular/core';
import { MiningService, MiningEvent } from '../..//service/mining.service';
import { PageEvent } from '@angular/material';



@Component({
  selector: 'app-mining-events',
  templateUrl: './mining-events.component.html',
  styleUrls: ['./mining-events.component.scss']
})
export class MiningEventsComponent implements OnInit {
  miningEventsList: Array<MiningEvent> = [];
  pageSize: number = 10;
  pageEvent: PageEvent;

  constructor(private miningService: MiningService) { }

  ngOnInit() {

     this.miningService.getMiningEvents().subscribe(events => {
       this.miningEventsList = events;
     });
  }

  get count(): number {
    return this.miningEventsList.length;
  }

  get items(): Array<MiningEvent> {
    if (this.pageEvent) {
      var startIndex = this.pageEvent.pageSize * this.pageEvent.pageIndex;
      var endIndex = startIndex + this.pageEvent.pageSize;
      return this.miningEventsList.sort((a,b)=> { return b.timestamp.getTime() - a.timestamp.getTime()}).slice(startIndex, endIndex);
    }
    else {
      var startIndex = 0;
      var endIndex = this.pageSize;
      return this.miningEventsList.sort((a,b)=> { return b.timestamp.getTime() - a.timestamp.getTime()}).slice(startIndex, endIndex);
    }
  }
}
