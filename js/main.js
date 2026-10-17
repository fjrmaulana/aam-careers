/* Advertising & More — Careers page interactions (vanilla JS, no dependencies)
   NOTE: design concept. The form validates fully but never sends data anywhere. */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ================= Header, menu, scroll-to-top ================= */
  var header = $(".site-header");
  var toTop = $("#to-top");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  var toggle = $(".menu-toggle");
  var nav = $("#main-nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  }

  /* ================= Role filters ================= */
  $$(".role-filters .chip").forEach(function (chip, _, all) {
    chip.addEventListener("click", function () {
      all.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      var f = chip.dataset.filter;
      $$(".role").forEach(function (r) { r.classList.toggle("is-hidden", f !== "all" && r.dataset.team !== f); });
    });
  });

  var roleSelect = $("#role");
  $$(".role-apply").forEach(function (a) {
    a.addEventListener("click", function () {
      roleSelect.value = a.dataset.role;
      validateField("role");
    });
  });

  /* ================= Date helpers ================= */
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  var TODAY = startOfDay(new Date());
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmt(d) { return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function parse(str) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((str || "").trim());
    if (!m) return null;
    var d = new Date(+m[3], +m[2] - 1, +m[1]);
    if (d.getFullYear() !== +m[3] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[1]) return null;
    return d;
  }
  function addYears(d, n) { var x = new Date(d); x.setFullYear(x.getFullYear() + n); return x; }
  function sameDay(a, b) { return a && b && a.getTime() === b.getTime(); }

  var LIMITS = {
    dob: { min: addYears(TODAY, -80), max: addYears(TODAY, -16), start: addYears(TODAY, -25) },
    future: { min: TODAY, max: addYears(TODAY, 2), start: TODAY }
  };

  /* ================= Date picker ================= */
  var openPicker = null;

  function DatePicker(wrap) {
    this.wrap = wrap;
    this.input = $("input", wrap);
    this.btn = $(".date-btn", wrap);
    this.lim = LIMITS[wrap.dataset.mode] || LIMITS.future;
    this.el = null;
    var self = this;

    this.btn.addEventListener("click", function () { self.isOpen() ? self.close() : self.open(); });
    this.input.addEventListener("input", function () {
      // auto-insert slashes: DDMMYYYY -> DD/MM/YYYY
      var v = self.input.value.replace(/[^\d]/g, "").slice(0, 8);
      var out = v.length > 4 ? v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4) : v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v;
      self.input.value = out;
    });
    this.input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" && e.altKey) { e.preventDefault(); self.open(); }
    });
  }
  DatePicker.prototype.isOpen = function () { return !!this.el; };
  DatePicker.prototype.open = function () {
    if (openPicker && openPicker !== this) openPicker.close();
    var sel = parse(this.input.value);
    this.selected = sel;
    var base = sel || this.lim.start;
    this.view = new Date(base.getFullYear(), base.getMonth(), 1);
    this.focusDate = sel || (this.lim.start < this.lim.min ? this.lim.min : this.lim.start);
    this.el = document.createElement("div");
    this.el.className = "dp";
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-label", this.btn.getAttribute("aria-label"));
    this.wrap.appendChild(this.el);
    this.btn.setAttribute("aria-expanded", "true");
    openPicker = this;
    this.render(true);
    // open upwards when there isn't room below the field
    var r = this.el.getBoundingClientRect();
    var above = this.wrap.getBoundingClientRect().top;
    if (r.bottom > window.innerHeight - 8 && above > r.height + 16) this.el.classList.add("dp-up");
  };
  DatePicker.prototype.close = function (refocus) {
    if (!this.el) return;
    this.el.remove();
    this.el = null;
    this.btn.setAttribute("aria-expanded", "false");
    if (openPicker === this) openPicker = null;
    if (refocus) this.btn.focus();
  };
  DatePicker.prototype.inRange = function (d) { return d >= this.lim.min && d <= this.lim.max; };
  DatePicker.prototype.pick = function (d) {
    this.input.value = fmt(d);
    this.close(true);
    validateField(this.input.id);
  };
  DatePicker.prototype.render = function (focus) {
    var self = this, v = this.view, y = v.getFullYear(), m = v.getMonth();
    var minY = this.lim.min.getFullYear(), maxY = this.lim.max.getFullYear();

    var monthOpts = MONTHS.map(function (name, i) { return '<option value="' + i + '"' + (i === m ? " selected" : "") + ">" + name.slice(0, 3) + "</option>"; }).join("");
    var yearOpts = "";
    for (var yy = maxY; yy >= minY; yy--) yearOpts += '<option value="' + yy + '"' + (yy === y ? " selected" : "") + ">" + yy + "</option>";

    var html = '<div class="dp-head">' +
      '<button type="button" class="dp-nav" data-nav="-1" aria-label="Previous month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' +
      '<select class="dp-month" aria-label="Month">' + monthOpts + "</select>" +
      '<select class="dp-year" aria-label="Year">' + yearOpts + "</select>" +
      '<button type="button" class="dp-nav" data-nav="1" aria-label="Next month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>' +
      '</div><div class="dp-grid" role="grid">';
    DOW.forEach(function (d) { html += '<span class="dp-dow" role="columnheader">' + d + "</span>"; });

    var first = new Date(y, m, 1);
    var lead = (first.getDay() + 6) % 7; // Monday-first
    for (var i = 0; i < lead; i++) html += '<span class="dp-day is-blank" aria-hidden="true"></span>';
    var days = new Date(y, m + 1, 0).getDate();
    for (var d = 1; d <= days; d++) {
      var date = new Date(y, m, d);
      var ok = this.inRange(date);
      var isSel = sameDay(date, this.selected);
      var isFocus = sameDay(date, this.focusDate);
      html += '<button type="button" class="dp-day' + (sameDay(date, TODAY) ? " is-today" : "") + '" data-day="' + d + '"' +
        (ok ? "" : " disabled") + ' aria-selected="' + (isSel ? "true" : "false") + '"' +
        ' tabindex="' + (isFocus && ok ? "0" : "-1") + '" aria-label="' + d + " " + MONTHS[m] + " " + y + '">' + d + "</button>";
    }
    html += "</div>";
    var todayOk = this.inRange(TODAY);
    html += '<div class="dp-foot">' + (todayOk ? '<button type="button" class="dp-link" data-today>Today</button>' : "<span></span>") +
      '<button type="button" class="dp-link" data-close>Close</button></div>';
    this.el.innerHTML = html;

    $(".dp-month", this.el).addEventListener("change", function (e) { self.view = new Date(self.view.getFullYear(), +e.target.value, 1); self.render(); });
    $(".dp-year", this.el).addEventListener("change", function (e) { self.view = new Date(+e.target.value, self.view.getMonth(), 1); self.render(); });
    $$(".dp-nav", this.el).forEach(function (b) {
      b.addEventListener("click", function () {
        var nv = new Date(self.view.getFullYear(), self.view.getMonth() + (+b.dataset.nav), 1);
        if (nv.getFullYear() < minY || nv.getFullYear() > maxY) return;
        self.view = nv; self.render();
      });
    });
    $$(".dp-day[data-day]", this.el).forEach(function (b) {
      b.addEventListener("click", function () { self.pick(new Date(y, m, +b.dataset.day)); });
    });
    var t = $("[data-today]", this.el);
    if (t) t.addEventListener("click", function () { self.pick(new Date(TODAY)); });
    $("[data-close]", this.el).addEventListener("click", function () { self.close(true); });

    this.el.addEventListener("keydown", function (e) { self.onKey(e); });
    if (focus) {
      var f = $('.dp-day[tabindex="0"]', this.el) || $(".dp-day:not(:disabled):not(.is-blank)", this.el) || $(".dp-month", this.el);
      if (f) f.focus();
    }
  };
  DatePicker.prototype.onKey = function (e) {
    if (e.key === "Escape") { e.preventDefault(); this.close(true); return; }
    var target = e.target;
    if (!target.classList.contains("dp-day")) return;
    var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!step) return;
    e.preventDefault();
    var cur = new Date(this.view.getFullYear(), this.view.getMonth(), +target.dataset.day);
    var next = new Date(cur); next.setDate(cur.getDate() + step);
    if (!this.inRange(next)) return;
    this.focusDate = next;
    this.view = new Date(next.getFullYear(), next.getMonth(), 1);
    this.render(true);
  };

  var pickers = $$("[data-datepicker]").map(function (w) { return new DatePicker(w); });
  document.addEventListener("click", function (e) {
    // ignore clicks on elements the picker just re-rendered away
    if (openPicker && document.contains(e.target) && !openPicker.wrap.contains(e.target)) openPicker.close();
  });

  /* ================= Nationality toggle ================= */
  var passportField = $("#passport-field");
  var passport = $("#passport");
  $$('input[name="nationality"]').forEach(function (r) {
    r.addEventListener("change", function () {
      var foreign = $('input[name="nationality"]:checked').value === "foreigner";
      passportField.hidden = !foreign;
      passport.required = foreign;
      if (!foreign) { passport.value = ""; setError("passport", ""); }
    });
  });

  /* ================= LinkedIn: add https:// if missing ================= */
  var linkedin = $("#linkedin");
  linkedin.addEventListener("blur", function () {
    var v = linkedin.value.trim();
    if (v && !/^https?:\/\//i.test(v) && /linkedin\.com/i.test(v)) linkedin.value = "https://" + v;
  });

  /* ================= CV upload ================= */
  var MAX_MB = 5;
  var ALLOWED = ["pdf", "doc", "docx"];
  var cvInput = $("#cv");
  var dropzone = $("#dropzone");
  var chip = $("#file-chip");
  var cvFile = null;

  function humanSize(b) { return b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / 1024 / 1024).toFixed(1) + " MB"; }
  function setFile(file) {
    cvFile = file || null;
    if (cvFile) {
      $("#file-name").textContent = cvFile.name;
      $("#file-size").textContent = humanSize(cvFile.size);
      chip.hidden = false;
      dropzone.hidden = true;
    } else {
      cvInput.value = "";
      chip.hidden = true;
      dropzone.hidden = false;
    }
    validateField("cv");
  }
  cvInput.addEventListener("change", function () { setFile(cvInput.files[0]); });
  ["dragenter", "dragover"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.add("is-drag"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.remove("is-drag"); });
  });
  dropzone.addEventListener("drop", function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) setFile(f);
  });
  $("#file-remove").addEventListener("click", function () { setFile(null); cvInput.focus(); });

  /* ================= Validation ================= */
  var form = $("#apply-form");
  var touched = {};

  function setError(id, msg) {
    var el = document.getElementById(id);
    var err = document.getElementById(id + "-error");
    var field = (el && el.closest(".field")) || (err && err.closest(".field"));
    if (err) err.textContent = msg || "";
    if (field) field.classList.toggle("has-error", !!msg);
    if (el && el.setAttribute) el.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  var rules = {
    role: function () { return roleSelect.value ? "" : "Please choose the position you are applying for."; },
    fullname: function () {
      var v = $("#fullname").value.trim();
      if (!v) return "Please enter your full name as per IC.";
      if (v.length < 3) return "Your name looks too short.";
      if (!/^[A-Za-zÀ-ɏ\s.'@\/-]+$/.test(v)) return "Please use letters only (spaces, @ / . ' - are allowed).";
      return "";
    },
    passport: function () {
      if (!passport.required) return "";
      var v = passport.value.trim();
      if (!v) return "Passport number is required for foreign applicants.";
      if (!/^[A-Za-z0-9]{6,12}$/.test(v)) return "Use 6–12 letters or numbers, without spaces.";
      return "";
    },
    dob: function () {
      var v = $("#dob").value.trim();
      if (!v) return "Please enter your date of birth.";
      var d = parse(v);
      if (!d) return "Use the format DD/MM/YYYY.";
      if (d > LIMITS.dob.max) return "Applicants must be at least 16 years old.";
      if (d < LIMITS.dob.min) return "Please check the year of birth.";
      return "";
    },
    phone: function () {
      var digits = $("#phone").value.replace(/[\s\-()]/g, "");
      if (!digits) return "Please enter your mobile number.";
      if (!/^\d{7,12}$/.test(digits.replace(/^0/, ""))) return "Enter a valid mobile number (digits only).";
      return "";
    },
    employer: function () { return $("#employer").value.trim() ? "" : "Please enter your current employer, or “Not employed”."; },
    startdate: function () {
      var v = $("#startdate").value.trim();
      if (!v) return "Please choose your earliest starting date.";
      var d = parse(v);
      if (!d) return "Use the format DD/MM/YYYY.";
      if (d < TODAY) return "The starting date cannot be in the past.";
      if (d > LIMITS.future.max) return "Please choose a date within the next 2 years.";
      return "";
    },
    linkedin: function () {
      var v = linkedin.value.trim();
      if (!v) return "Please add your LinkedIn profile URL.";
      if (!/^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%.]{2,100}\/?(\?.*)?$/i.test(v)) return "Use a profile link like https://www.linkedin.com/in/your-name";
      return "";
    },
    cv: function () {
      if (!cvFile) return "Please upload your resume / CV.";
      var ext = (cvFile.name.split(".").pop() || "").toLowerCase();
      if (ALLOWED.indexOf(ext) === -1) return "Only PDF, DOC or DOCX files are accepted.";
      if (cvFile.size > MAX_MB * 1024 * 1024) return "This file is " + humanSize(cvFile.size) + ". The maximum size is " + MAX_MB + " MB.";
      if (cvFile.size === 0) return "This file appears to be empty.";
      return "";
    },
    consent: function () { return $("#consent").checked ? "" : "Please confirm before submitting."; }
  };

  function validateField(id) { return setError(id, rules[id] ? rules[id]() : ""); }

  Object.keys(rules).forEach(function (id) {
    var el = document.getElementById(id);
    if (!el || id === "cv") return; // CV validates on file change
    var evt = (el.tagName === "SELECT" || el.type === "checkbox") ? "change" : "blur";
    el.addEventListener(evt, function (e) {
      // don't flag a date field while the user moves into its calendar
      var wrap = el.closest("[data-datepicker]");
      if (wrap && e.relatedTarget && wrap.contains(e.relatedTarget)) return;
      setTimeout(function () {
        if (openPicker && openPicker.input === el) return;
        touched[id] = true;
        validateField(id);
      }, 0);
    });
    el.addEventListener("input", function () { if (touched[id]) validateField(id); });
  });

  var status = $("#form-status");
  var success = $("#success");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstBad = null, bad = 0;
    Object.keys(rules).forEach(function (id) {
      touched[id] = true;
      if (!validateField(id)) { bad++; if (!firstBad) firstBad = id; }
    });
    if (bad) {
      status.textContent = bad === 1 ? "Please fix 1 field above." : "Please fix " + bad + " fields above.";
      var target = firstBad === "cv" ? cvInput : document.getElementById(firstBad);
      var field = target.closest(".field");
      if (field) field.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () { target.focus({ preventScroll: true }); }, 250);
      return;
    }
    status.textContent = "";
    // Demo only: nothing is transmitted. Connect to the site's backend (e.g. Elementor Forms / WP REST) when going live.
    var name = $("#fullname").value.trim().split(/\s+/)[0];
    $("#success-text").textContent = "Thanks, " + name + "! Your application for " + roleSelect.value +
      " is in. We’ll review it and get back to you soon. The coffee is on us when we meet.";
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
    success.focus({ preventScroll: true });
  });

  $("#apply-again").addEventListener("click", function () {
    form.reset();
    touched = {};
    setFile(null);
    passportField.hidden = true;
    passport.required = false;
    Object.keys(rules).forEach(function (id) { setError(id, ""); });
    success.hidden = true;
    form.hidden = false;
    roleSelect.focus();
  });

  /* ================= Misc ================= */
  var year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
  void pickers;
})();
