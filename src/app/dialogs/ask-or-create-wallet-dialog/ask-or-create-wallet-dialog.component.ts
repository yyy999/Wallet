import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogResult } from '../../config/dialog-result';

@Component({
  selector: 'app-ask-or-create-wallet-dialog',
  templateUrl: './ask-or-create-wallet-dialog.component.html',
  styleUrls: ['./ask-or-create-wallet-dialog.component.scss']
})
export class AskOrCreateWalletDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<AskOrCreateWalletDialogComponent>
  ) { }

  ngOnInit() {
  }

  answerCreateNewWallet(){
    this.dialogRef.close(DialogResult.CreateWallet);
  }

  cancel(){
    this.dialogRef.close(DialogResult.Cancel);
  }
}
