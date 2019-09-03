import { Component, OnInit, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { DialogResult } from '../../config/dialog-result';
import { LoadAssetsFilesService } from '../../service/load-assets-files.service';
import { ConfigService } from '../../service/config.service';

export interface DialogData {
  shown: boolean;
}

@Component({
  selector: 'app-software-license-agreement-dialog',
  templateUrl: './software-license-agreement-dialog.component.html',
  styleUrls: ['./software-license-agreement-dialog.component.scss']
})
export class SoftwareLicenseAgreementComponent implements OnInit {
  validationChecked: boolean;
  termsOfServiceContent: string;
  public shown:boolean;

  constructor(
    public dialogRef: MatDialogRef<SoftwareLicenseAgreementComponent>,
    private loadAssetsFileService : LoadAssetsFilesService,
    private configService: ConfigService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }
  

  ngOnInit() {
   
    // this.loadAssetsFileService.getFile("TOS.txt").subscribe(content =>{
    //   this.termsOfServiceContent = content.toString();
    // });
    this.dialogRef.afterOpened().subscribe(() => {

    });
  }

  yes() {
    if (this.validationChecked) {
      this.dialogRef.close(DialogResult.Yes);
    }
  }

  no() {
    this.dialogRef.close(DialogResult.No);
  }

  close() {
    this.dialogRef.close();
  }
}
