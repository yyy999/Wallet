import { Component, OnInit, Optional, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RequestCopyKeyFileParameters, PassphraseRequestType } from '../..//model/passphraseRequiredParameters';
import { TranslateService } from '@ngx-translate/core';

class DialogParameters{
  public parameters: RequestCopyKeyFileParameters;
  public type: PassphraseRequestType;
}
@Component({
  selector: 'app-ask-copy-key-dialog',
  templateUrl: './ask-copy-key-dialog.component.html',
  styleUrls: ['./ask-copy-key-dialog.component.scss']
})
export class AskCopyWalletKeyFileDialogComponent implements OnInit {
  keyName:string;
  accountUuid:string;
  attempt:number;

  constructor(
    private translateService:TranslateService,
    public dialogRef: MatDialogRef<AskCopyWalletKeyFileDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DialogParameters) {

      if(this.data.type === PassphraseRequestType.Key){

        let keyRequest = (<RequestCopyKeyFileParameters>this.data.parameters);
        this.keyName = keyRequest.keyname;
        this.accountUuid = keyRequest.accountID;
      }
     }

  ngOnInit() {
  }

  ok(){
    this.dialogRef.close('');
  }
}
