import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check } from "lucide-react";
import { enterDemo } from "@/lib/auth-actions";
import { demoAvailable } from "@/lib/demo/mode";
import { FeeExample, LandingMotion } from "@/components/landing-interactions";
import "./landing.css";

export const metadata: Metadata = {
  title: "CICO — A better day at the counter",
  description: "A record book for Philippine cash-in and cash-out counters. Keep fees, receipts and daily totals together, and prevent duplicate payouts.",
};

function OpenCico({ large = false }: { large?: boolean }) {
  const className = large ? "cico-bigAction" : "cico-action";
  return demoAvailable ? (
    <form action={enterDemo}>
      <button className={className} type="submit">
        {large ? "Try CICO" : "Try the demo"}<ArrowUpRight aria-hidden />
      </button>
    </form>
  ) : (
    <Link className={className} href="/login">
      Open CICO<ArrowUpRight aria-hidden />
    </Link>
  );
}

const questions = [
  { topic: "Your wallet", question: "Does CICO move my money?", answer: "You make every transfer in your own e-wallet app. CICO is your record book: it keeps the amount, fee, reference number and receipt together. It never asks for your wallet PIN, password or one-time code." },
  { topic: "Your fees", question: "Can I set my own rates?", answer: "Yes. Set a fixed fee for each amount range in your fee table. The same table covers cash-in and cash-out. Each record keeps the fee it was saved with, even when you change your rates later." },
  { topic: "Your records", question: "Can a transfer be paid twice?", answer: "A transfer reference can only be completed on one cash-out. Before you hand over cash, CICO also asks you to confirm that the money has arrived in your own wallet history. A screenshot alone is never proof." },
  { topic: "Your counter", question: "Will it work on my phone?", answer: "Yes. Record transactions on your phone at the counter, then open your reports on a computer. When your shop is connected, your records stay with your operator account across devices." },
];

export default function LandingPage() {
  return (
    <div className={"cico-landing"}>
      <LandingMotion />
      <a className={"cico-skip"} href="#main">Skip to content</a>
      <header className={"cico-nav"}>
        <Link className={"cico-logo"} href="/" aria-label="CICO home">CICO<span className={"cico-logoDot"} /></Link>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#the-details">The details</a>
          <a href="#questions">Questions</a>
        </nav>
        <Link href="/login" className={"cico-signIn"}>Sign in <ArrowUpRight aria-hidden size={18} /></Link>
      </header>

      <main id="main">
        <section className={"cico-hero"}>
          <div className={"cico-heroTop"}>
            <h1 data-reveal>A better day<br />at the counter.</h1>
            <div className={"cico-heroIntro"}>
              <p data-reveal>A record book for your cash-in and cash-out business. Every transfer, every fee, all accounted for.</p>
              <div data-reveal><OpenCico /></div>
              <p className={"cico-small"} data-reveal>{demoAvailable ? "Explore with sample records. No account needed." : "Your wallet does the transfers. CICO keeps the books."}</p>
            </div>
          </div>
          <div className={"cico-heroMedia"} data-reveal>
            <div className={"cico-mediaCaption"}><span>Your counter, with everything in order.</span><a href="#how-it-works" aria-label="See how CICO works"><ArrowDown aria-hidden size={20} /></a></div>
            <div className={"cico-heroCrop"} data-ui>
              <Image src="/landing/home.webp" width={1600} height={1000} alt="CICO operator home with cash-in, cash-out and pending transactions" preload sizes="(max-width: 700px) 950px, 100vw" />
            </div>
          </div>
          <div className={"cico-heroFoot"}><span>Made for the everyday counter.</span><span>Cash in. Cash out. Keep track.</span></div>
        </section>

        <section className={"cico-fees"} id="the-details">
          <div className={"cico-sectionIntro"}>
            <h2 data-reveal>Know what’s yours.</h2>
            <p data-reveal>The money passing through your counter and the money you earn are two different things. CICO keeps them separate.</p>
          </div>
          <FeeExample />
        </section>

        <section id="how-it-works" className={"cico-workflow"}>
          <div className={"cico-workflowCopy"}>
            <h2 data-reveal>One less thing<br />to keep in your head.</h2>
            <p data-reveal>From the first customer to closing time, there’s a place for every part of the transaction.</p>
            <ol className={"cico-steps"}>
              <li data-reveal><h3>Enter the amount.</h3><p>Your fee table does the math. See the transfer, the fee and what the customer pays.</p></li>
              <li data-reveal><h3>Check. Then record.</h3><p>Make the transfer in your wallet app. Keep the reference and receipt with the right record.</p></li>
              <li data-reveal><h3>Close with clear totals.</h3><p>See the money you moved and the fees you earned, for today or any date range.</p></li>
            </ol>
          </div>
          <div className={"cico-workflowVisual"}>
            <div className={"cico-folderLabel"}>Cash-in</div>
            <div className={"cico-workflowCrop"} data-ui data-reveal><Image src="/landing/cash-in.webp" width={1600} height={1000} alt="Cash-in form showing a separate fee and the total a customer pays" sizes="(max-width: 800px) 100vw, 55vw" /></div>
            <div className={"cico-receipt"} data-reveal>
              <p>Amount. Fee. Reference.<br />Receipt. All together.</p>
              <Check aria-hidden size={32} />
            </div>
          </div>
        </section>

        <section className={"cico-pending"}>
          <div className={"cico-pendingVisual"} data-reveal>
            <span className={"cico-folderLabel"}>Pending</span>
            <div className={"cico-pendingCrop"} data-ui><Image src="/landing/pending.webp" width={1600} height={1000} alt="Pending cash-outs waiting for the operator to verify that money has arrived" sizes="(max-width: 800px) 100vw, 55vw" /></div>
          </div>
          <div className={"cico-pendingCopy"}>
            <h2 data-reveal>Still waiting?<br />Keep it pending.</h2>
            <p data-reveal>When the sender and receiver are different people, send a private receipt upload link. Their receipt goes straight to the right cash-out.</p>
            <p data-reveal>Check your own wallet before handing over cash. Once a reference is paid out, it can’t be paid out again.</p>
            <span className={"cico-plainNote"} data-reveal><Check aria-hidden size={20} /> One reference. One payout.</span>
          </div>
        </section>

        <section className={"cico-reports"}>
          <div className={"cico-sectionIntro"}>
            <h2 data-reveal>Shut the shop.<br />Skip the sums.</h2>
            <p data-reveal>Your day, already added up. Cash-in, cash-out and fee income in one report, with every date in Philippine time.</p>
          </div>
          <div className={"cico-reportImage"} data-ui data-reveal><Image src="/landing/reports.webp" width={1600} height={1000} alt="CICO reports with separate totals for cash-in, cash-out and fees earned" sizes="100vw" /></div>
          <p className={"cico-small"}>Screens show sample records for illustration.</p>
        </section>

        <section className={"cico-faq"} id="questions">
          <h2 data-reveal>A few good questions.</h2>
          <div className={"cico-faqStack"}>
            {questions.map((item, index) => (
              <details key={item.topic} className={"cico-faqItem"} name="cico-questions" open={index === 0} data-reveal>
                <summary><span className={"cico-faqTab"}>{item.topic}</span><span>{item.question}</span><span className={"cico-plus"} aria-hidden>+</span></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={"cico-cta"}>
          <p data-reveal>Your next customer is coming.<br />Have your record book ready.</p>
          <div data-reveal><OpenCico large /></div>
        </section>
      </main>

      <footer className={"cico-footer"}>
        <div className={"cico-footerTop"}><p>A little order.<br />At a busy counter.</p><nav aria-label="Footer navigation"><a href="#how-it-works">How it works</a><a href="#questions">Questions</a><Link href="/login">Operator sign in</Link></nav><p>Cash in. Cash out.<br />Made for the Philippines.</p></div>
        <Link href="/" className={"cico-footerLogo"} aria-label="CICO home">CICO</Link>
        <div className={"cico-footerBottom"}><span>© CICO</span><span>Your records. Your business.</span></div>
      </footer>
    </div>
  );
}
