import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import moment, * as momentObj from 'moment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss']
})
export class AboutDialogComponent implements OnInit, OnDestroy {

  public Year:number;

  constructor(public dialogRef: MatDialogRef<AboutDialogComponent>) { 
   this.Year = (moment().toDate()).getFullYear();
  }

  ngOnInit() {
  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
       this.unsubscribe$.next();
       this.unsubscribe$.complete();
     }

     
  close(){
    this.dialogRef.close();
  }

}
