import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-test-mode-alter-dialog',
  templateUrl: './test-mode-alter-dialog.component.html',
  styleUrls: ['./test-mode-alter-dialog.component.scss']
})
export class TestModeAlterDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<TestModeAlterDialogComponent>) { }

  ngOnInit() {
  }

  close(){
    this.dialogRef.close();
  }

}
