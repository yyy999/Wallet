import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss']
})
export class AboutDialogComponent implements OnInit {

  public Year:number;

  constructor(public dialogRef: MatDialogRef<AboutDialogComponent>) { 
   this.Year = (new Date()).getFullYear();
  }

  ngOnInit() {
  }

  close(){
    this.dialogRef.close();
  }

}
