import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'wrapper-auth-background',
  template: `

<div class="relative container min-h-[100vh] w-dvw">
      <ng-content ></ng-content>
  </div>
  `,
  styles: `

    @keyframes enterFadeUp {
      0% {
        opacity: 0;
        transform: translateX(-24px);
      }

      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes PaneLoginEnter {
      0% {
        opacity: 0;
        transform: translateY(-10px);
      }

      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animete-titulo-1 {
      opacity: 0;
      animation: enterFadeUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .animete-titulo-2 {
      opacity: 0;
      animation: enterFadeUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      animation-delay: .2s;
    }

    .animate-page {
      opacity: 0;
      animation: PaneLoginEnter 0.85s linear;
    }

  `
})

export class WrapperAuthBackGroundComponent implements OnInit {
  constructor() { }

  ngOnInit() { }
}
