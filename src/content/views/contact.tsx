import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { initContactFlow } from '../../animations/contact-flow';

export const ContactContent = component$(() => {
  const page = useSignal<HTMLElement>();
  const canvas = useSignal<HTMLCanvasElement>();

  useVisibleTask$(({ cleanup }) => {
    if (!page.value || !canvas.value) return;
    cleanup(initContactFlow(page.value, canvas.value));
  }, { strategy: 'intersection-observer' });

  return (
    <>
    <main class="contact-page" ref={page}>
      <canvas id="contact-flow-canvas" class="contact-flow-canvas" ref={canvas} aria-hidden="true"></canvas>
      <section class="contact-body" aria-labelledby="contact-heading">
        <div class="contact-intro">
        <h1 class="contact-cta" id="contact-heading"><span>Reach out.</span><span>I read everything.</span></h1>
        <button class="contact-about-btn" id="talk-btn" type="button" aria-haspopup="dialog" aria-controls="about-modal">
        Let’s talk <span class="contact-about-arrow" aria-hidden="true">→</span></button>
        </div>
        <div class="contact-compose">
        <form class="mail-composer" id="contact-form" noValidate={true}>
          <div class="mc-header-bar">
            <span class="mc-header-title">compose.</span>
          </div>
          <input type="hidden" name="access_key" value="e3484fe8-1916-4d0a-96d9-411246c55ce4" />
          <input type="hidden" name="subject" id="mc-subject-field" value="New message via xensenx.dev" />
          <input type="checkbox" name="botcheck" class="mc-honeypot" tabIndex={-1} autocomplete="off" aria-hidden="true" />
          <div class="mc-row mc-to-row">
            <span class="mc-label">To</span>
            <button type="button" class="mc-to-chip mc-direct-mail-trigger" id="direct-mail-btn" aria-haspopup="dialog" aria-controls="direct-mail-modal">Click here to Mail directly</button>
          </div>
          <div class="mc-row mc-from-row" id="mc-from-row">
            <span class="mc-label">From</span>
            <input class="mc-inline-input mc-name-input" type="text" id="mc-name" name="name" placeholder="Your name" autocomplete="name" maxLength={120} required={true} aria-label="Your name" />
            <span class="mc-angle" aria-hidden="true">&lt;</span>
            <input class="mc-inline-input mc-email-input" type="email" id="mc-email" name="email" placeholder="your.email@example.com" autocomplete="email" maxLength={254} required={true} aria-label="Your email address" />
            <span class="mc-angle" aria-hidden="true">&gt;</span>
          </div>
          <div class="mc-row mc-subject-row" id="mc-subject-row">
            <label class="mc-label" htmlFor="mc-subject">Subject</label>
            <input class="mc-inline-input mc-subject-input" type="text" id="mc-subject" name="custom_subject" placeholder="What is this regarding?" maxLength={180} required={true} />
          </div>
          <div class="mc-toolbar" role="toolbar" aria-label="Message formatting">
            <div class="mc-toolbar-group">
              <button type="button" class="mc-tool" data-cmd="bold" title="Bold (Ctrl+B)" aria-label="Bold">
                <b>B</b>
              </button>
              <button type="button" class="mc-tool" data-cmd="italic" title="Italic (Ctrl+I)" aria-label="Italic">
                <i>I</i>
              </button>
              <button type="button" class="mc-tool" data-cmd="underline" title="Underline (Ctrl+U)" aria-label="Underline">
                <u>U</u>
              </button>
            </div>
            <span class="mc-tool-sep" aria-hidden="true"></span>
            <div class="mc-toolbar-group">
              <button type="button" class="mc-tool" data-cmd="insertUnorderedList" title="Bullet list" aria-label="Bullet list">
                <span class="mc-tool-icon">•—</span>
              </button>
              <button type="button" class="mc-tool" data-cmd="insertOrderedList" title="Numbered list" aria-label="Numbered list">
                <span class="mc-tool-icon">1.</span>
              </button>
            </div>
            <span class="mc-tool-sep" aria-hidden="true"></span>
            <div class="mc-toolbar-group">
              <button type="button" class="mc-tool mc-tool-clear" data-cmd="removeFormat" title="Clear formatting" aria-label="Clear formatting">
                <span class="mc-tool-icon">×</span>

                <span class="mc-tool-label">Clear</span>
              </button>
            </div>
          </div>
          <div class="mc-body empty" id="mc-body" contentEditable="true" role="textbox" aria-multiline="true" aria-label="Message body" aria-describedby="mc-status" data-placeholder="Write your note here…"></div>
          <div class="mc-honeypot-wrap" aria-hidden="true">
            <label htmlFor="mc-website">Leave this field empty</label>
            <input id="mc-website" type="text" name="website" tabIndex={-1} autocomplete="off" />
          </div>
          <div class="mc-actions">
            <div class="mc-status-wrap">
              <span class="mc-status" id="mc-status" aria-live="polite" role="status"></span>
            </div>
            <button type="submit" class="mc-send" id="mc-send-btn">
              <span class="mc-send-text">Send message</span>
              <span class="mc-send-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </form>
        <section class="mc-success-card" id="mc-success-card" aria-live="polite" aria-hidden="true" aria-labelledby="mc-success-title" hidden={true}>
          <div class="mc-success-header">
            <div class="mc-success-badge">
              <span class="mc-success-icon" aria-hidden="true">✓</span>
              <span>Received</span>
            </div>
          </div>
          <h2 class="mc-success-title" id="mc-success-title" tabIndex={-1}>Message submitted</h2>
          <p class="mc-success-desc">Your message was accepted by the contact service. I read messages personally and will reply when I can.</p>
          <div class="mc-success-note">
            <span class="mc-note-tag">Attachments &amp; continuation</span>
            <p class="mc-note-text">If you need to send an attachment or continue the conversation, write directly to <a href="mailto:hello@xensenx.dev" class="mc-mail-link">hello@xensenx.dev</a>.</p>
          </div>
          <div class="mc-success-footer">
            <button type="button" class="mc-reset-btn" id="mc-reset-btn">
              <span>Send another message</span>
              <span class="mc-reset-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </section>
        </div>
      </section>
    </main>
    </>
  );
});
