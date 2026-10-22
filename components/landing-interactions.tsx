"use client";

import { useEffect, useState } from "react";
import { formatPesos } from "@/lib/money";

export function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("cico-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return null;
}

export function FeeExample() {
  const [amount, setAmount] = useState(1000);
  const fee = amount <= 500 ? 10 : amount <= 1000 ? 20 : 30;
  return (
    <div className={"cico-feeExample"} data-ui>
      <div className={"cico-amountBlock"} data-reveal>
        <label htmlFor="example-amount">Customer’s transfer</label>
        <output htmlFor="example-amount" className={"cico-bigNumber"}>{formatPesos(amount * 100).replace(".00", "")}</output>
        <input id="example-amount" aria-label="Example transfer amount in pesos" type="range" min="100" max="2000" step="100" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
        <div className={"cico-rangeLabels"}><span>₱100</span><span>Slide to try an amount</span><span>₱2,000</span></div>
      </div>
      <div className={"cico-feeBlock"} data-reveal>
        <span>Your fee income</span>
        <output className={"cico-bigNumber"} aria-live="polite">{formatPesos(fee * 100).replace(".00", "")}</output>
        <p>Paid on top. Always.</p>
      </div>
      <div className={"cico-exampleTotal"}>
        <span>Customer pays <strong aria-live="polite">{formatPesos((amount + fee) * 100)}</strong></span>
        <span>Example rates only. You set your own fees in CICO.</span>
      </div>
    </div>
  );
}
