import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-page-title',
  templateUrl: './page-title.component.html',
  styleUrls: ['./page-title.component.css']
})
export class PageTitleComponent implements OnInit {
  @Input() title:string;
  @Input() icon:string;
  @Input() helpMessage:string;
  @Input() showNeuraliumsTotal:boolean = false;
  
  constructor() { }

  ngOnInit() {
  }

}
