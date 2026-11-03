import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {prepareScene} from '../components/Scene';
import {Browser, Button, Cursor, Phone, TextField, Toast} from '../components/Ui';
import {C, t} from '../config';

// ---------- EDITABLE TEXT ----------
const TITLE = 'UI pack';
const S = ['Show a product working: a browser, a form and a pointer.', 'Actions get an answer on screen.', 'Phones work the same way.'];
// -----------------------------------

export default makeScene2D(function* (view) {
  const {root, sub, enter, leave} = prepareScene(view, TITLE);

  const browser = new Browser(root, {x: 0, y: -30, w: 1200, h: 680, url: 'shop.example.com'});
  const email = new TextField(browser.content(), {x: 0, y: -110, placeholder: 'Your email'});
  const password = new TextField(browser.content(), {x: 0, y: 0, placeholder: 'Password'});
  const signIn = new Button(browser.content(), {x: 0, y: 120, label: 'Sign in'});
  const toast = new Toast(browser.content(), {x: 0, y: 230, text: 'Welcome back!'});

  const phone = new Phone(root, {x: 0, y: -30, h: 740});
  const pay = new Button(phone.content(), {x: 0, y: 40, label: 'Pay $20'});
  const paid = new Toast(phone.content(), {x: 0, y: -120, w: 340, text: 'Payment sent'});

  const cursor = new Cursor(root, {x: 500, y: 300});

  yield* enter();
  yield* sub.say(S[0]);
  yield* browser.appear();
  yield* all(email.appear(), password.appear(), signIn.appear());
  yield* cursor.appear();
  yield* cursor.clickOn(email);
  yield* email.type('ana@example.com', 0.8);
  yield* cursor.clickOn(password, 0.4);
  yield* password.type('••••••••', 0.5);

  yield* sub.say(S[1]);
  yield* cursor.clickOn(signIn);
  yield* toast.appear();
  yield* waitFor(t(1));
  yield* browser.hide();

  yield* sub.say(S[2]);
  yield* phone.appear();
  yield* pay.appear();
  yield* cursor.clickOn(pay);
  yield* paid.appear();
  yield* pay.mark(C.ok, true);
  yield* waitFor(t(1.2));
  yield* all(sub.hide(), leave());
});
