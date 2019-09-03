import { Component, OnInit, Optional, Inject } from '@angular/core';
import { NeuraliumTransaction, NO_NEURALIUM_TRANSACTION } from '../..//model/transaction';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-transaction-details-dialog',
  templateUrl: './transaction-details-dialog.component.html',
  styleUrls: ['./transaction-details-dialog.component.scss']
})
export class TransactionDetailsDialogComponent implements OnInit {
  transaction : NeuraliumTransaction = NO_NEURALIUM_TRANSACTION;

  constructor(
    public dialogRef: MatDialogRef<TransactionDetailsDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: NeuraliumTransaction
  ) { 
    this.transaction = data;
  }

  ngOnInit() {
  }

  close(){
    this.dialogRef.close();
  }

}
