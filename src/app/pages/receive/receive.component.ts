import { Component, OnInit } from '@angular/core';
import { Pages } from '../..//model/ui-config';

@Component({
  selector: 'app-receive',
  templateUrl: './receive.component.html',
  styleUrls: ['./receive.component.css']
})
export class ReceiveComponent implements OnInit {
  title = Pages.Receive.label;
  icon = Pages.Receive.icon;

  constructor() { }

  ngOnInit() {
  }

}
