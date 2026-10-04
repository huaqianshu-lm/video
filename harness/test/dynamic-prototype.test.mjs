import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";

test("lightweight prototype plays semantic events, pauses, replays and changes Scenes without audio", () => {
  const html = fs.readFileSync(new URL("../../templates/video-production/visual-prototype.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /<audio\b|tts-script|audio-manifest/);
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const nodes = new Map();
  const element = () => ({dataset: {}, textContent: "", listeners: {}, style: {setProperty() {}}, classList: {toggle() {}}, addEventListener(name, handler) {this.listeners[name] = handler;}, querySelector() {return {clientWidth: 100, style: {setProperty() {}}};}});
  const sections = [element(), element()];
  const dots = [element(), element()];
  const document = {
    querySelectorAll(selector) {return selector === ".scene" ? sections : dots;},
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id);},
    querySelector() {return element();},
  };
  let tick;
  const context = vm.createContext({document, requestAnimationFrame(callback) {tick = callback;}});
  vm.runInContext(script + "\nscenePlans.push({...scenePlans[0], events: scenePlans[0].events.map(e => ({...e, id: 'second-' + e.id}))});", context);
  const click = id => nodes.get(id).listeners.click();
  click("play"); tick(0); tick(2500);
  assert.equal(sections[0].dataset.state, "action");
  click("play"); tick(6000);
  assert.equal(sections[0].dataset.state, "action");
  click("replay"); tick(6100);
  assert.equal(sections[0].dataset.state, "before");
  tick(10500);
  assert.equal(sections[0].dataset.state, "after");
  click("next");
  assert.equal(sections[1].dataset.eventId, "second-focus-established");
  click("previous");
  assert.equal(sections[0].dataset.eventId, "focus-established");
});
