import { Component, OnInit, OnDestroy } from '@angular/core';
import { MiningService, MiningEvent } from '../..//service/mining.service';
import { PageEvent } from '@angular/material/paginator';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';




@Component({
  selector: 'app-mining-events',
  templateUrl: './mining-events.component.html',
  styleUrls: ['./mining-events.component.scss']
})
export class MiningEventsComponent implements OnInit, OnDestroy {
  miningEventsList: Array<MiningEvent> = [];
  pageSize: number = 10;
  pageEvent: PageEvent;
  totalMessageCount:number = 0;
  pageSizeOptions: number[] = [10, 20, 30];
  sliceStart:number = 0;
  sliceEnd:number = this.pageSize;
  constructor(private miningService: MiningService) { 
    this.pageSize = 10;
    this.sliceEnd = this.pageSize;
  }

  ngOnInit() {

    this.miningEventsList = this.miningService.getMiningEvents();

  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
       this.unsubscribe$.next();
       this.unsubscribe$.complete();
     }
 

  setPage(event){

    this.sliceStart = event.pageIndex * event.pageSize;
    this.sliceEnd = this.sliceStart + event.pageSize;
  }

}
