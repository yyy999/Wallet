import { Component, OnInit, isDevMode } from '@angular/core';
import { MatDialog } from '@angular/material';
import { TestModeAlterDialogComponent } from '../..//dialogs/test-mode-alter-dialog/test-mode-alter-dialog.component';
import { AppConfig } from '../../../environments/environment';

@Component({
  selector: 'app-test-mode-message',
  templateUrl: './test-mode-message.component.html',
  styleUrls: ['./test-mode-message.component.scss']
})
export class TestModeMessageComponent implements OnInit {

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  showMe(){
    return AppConfig.testNet;
  }

  showDetails(){
    setTimeout(() => {
      this.dialog.open(TestModeAlterDialogComponent, {
        width: '350px'
      });
    });
  }
}
