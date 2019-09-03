import { Component, OnInit, Inject, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogResult } from '../../config/dialog-result';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {
  message:string;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: string) {
      this.message = data;
    }

  ngOnInit() {
  }

  yes(){
    this.dialogRef.close(DialogResult.Yes);
  }

  no(){
    this.dialogRef.close(DialogResult.No);
  }
}
