import { Component, OnInit, Optional, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { PassphraseParameters, KeyPassphraseParameters } from '../..//model/passphraseRequiredParameters';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-ask-key-dialog',
  templateUrl: './ask-key-dialog.component.html',
  styleUrls: ['./ask-key-dialog.component.scss']
})
export class AskKeyDialogComponent implements OnInit {
  keyName:string;
  attempt:number;
  showPasswords:boolean = false;
  password:string;

  constructor(
    private translateService:TranslateService,
    public dialogRef: MatDialogRef<AskKeyDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: PassphraseParameters) {
      this.attempt = data.attempt;
      if(data instanceof KeyPassphraseParameters){
        this.keyName = data.keyname;
      }
      else{
        this.translateService.get("wallet.Wallet").subscribe(wallet =>{
          this.keyName = wallet;
        })
      }
     }

  ngOnInit() {
  }

  ok(){
    this.dialogRef.close(this.password);
  }

  get passWordInputType():string{
    if(this.showPasswords){
      return "text";
    }
    else{
      return "password";
    }
  }

}
