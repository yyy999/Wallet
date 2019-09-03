import { Component, OnInit, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-help-icon',
  templateUrl: './help-icon.component.html',
  styleUrls: ['./help-icon.component.scss']
})
export class HelpIconComponent implements OnInit {
  @Input() message:string;
  messageTranslated:string = "";

  constructor(private translate:TranslateService) { }

  ngOnInit() {
    this.translate.get(this.message).subscribe(response =>{
      this.messageTranslated = response;
    });
  }

}
