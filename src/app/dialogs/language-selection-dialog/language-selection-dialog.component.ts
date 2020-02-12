import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfigService } from '../..//service/config.service';

@Component({
  selector: 'app-language-selection-dialog',
  templateUrl: './language-selection-dialog.component.html',
  styleUrls: ['./language-selection-dialog.component.scss']
})
export class LanguageSelectionDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<LanguageSelectionDialogComponent>,
    private translateService: TranslateService,
    private configService:ConfigService) { }

  ngOnInit() {
  }

  useLanguage(language: string) {
    this.translateService.use(language);
    this.configService.language = language;
    this.configService.saveSettings();
    this.dialogRef.close();
  }

}
