'use strict';
(() => {
  const config = window.GERMANY_CONFIG || {};
  const students = (window.GERMANY_STUDENTS || []).filter(s => s.enabled !== false);
  const byId = new Map(students.map(s => [s.id, s]));
  function https(value, hosts) {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && (!hosts || hosts.includes(u.hostname)) ? u.href : ''; } catch { return ''; }
  }
  const booking = id => https((config.calendly || {})[id], ['calendly.com', 'www.calendly.com']);
  document.querySelectorAll('[data-zoom-student]').forEach(a => {
    const url = booking(a.dataset.zoomStudent);
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  });
  document.querySelectorAll('[data-booking-status]').forEach(p => {
    p.textContent = booking(p.dataset.bookingStatus) ? 'Zoomの予約はCalendlyで行います。日時・決済条件をご確認ください。' : 'Zoom予約受付は準備中です。ボタンから相談内容・料金を確認できます。';
  });
  document.querySelectorAll('[data-service-availability]').forEach(p => {
    const available = students.some(s => booking(s.id)) || https(config.lineApplicationUrl) || config.lineApplicationEmail;
    p.textContent = available ? '現役学生のプロフィールから、Zoom・LINEそれぞれの予約・申込方法をご確認ください。' : '予約受付は準備中です。現役学生のプロフィールから、Zoom・LINEそれぞれの相談内容をご確認いただけます。';
  });
  const id = new URLSearchParams(location.search).get('student');
  const contact = document.getElementById('contactForm');
  if (contact) {
    const type = document.getElementById('inquiryType'), uni = document.getElementById('cf_uni'), year = document.getElementById('cf_year');
    const address = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
    const recipient = address.test(config.contactEmail || '') ? config.contactEmail : address.test(config.contactFallbackEmail || '') ? config.contactFallbackEmail : '';
    const recipientText = document.getElementById('contactRecipient');
    recipientText.textContent = recipient ? '送信先：' + recipient + (config.contactEmail ? '' : '（現在は留学ラボの共通運営窓口で受け付けています）') : 'お問い合わせの受付準備中です。';
    document.getElementById('contactSubmit').disabled = !recipient;
    function updateType() {
      const student = type.value === 'student';
      document.getElementById('studentContactFields').hidden = !student;
      uni.required = year.required = student;
      document.getElementById('contactNote').textContent = student ? '大学・課程・相談できるテーマをお知らせください。登録条件や掲載内容は運営と確認します。' : 'サービスや運営へのお問い合わせ用です。相談の予約・申込は各サービスの案内からお願いします。';
    }
    type.addEventListener('change',updateType); updateType();
    document.querySelectorAll('[data-contact-student]').forEach(a=>a.addEventListener('click',()=>{
      type.value = 'student'; updateType();
      if (a.closest('#studentRecruitment')) uni.value = document.getElementById('studentRecruitment').dataset.university || '';
    }));
    contact.addEventListener('submit',event=>{
      event.preventDefault(); if (!recipient || !contact.reportValidity()) return;
      const values = new FormData(contact);
      const purpose = type.options[type.selectedIndex].text;
      const body = ['ドイツ留学ラボ お問い合わせ','用件：'+purpose,'お名前：'+values.get('name'),'返信先メールアドレス：'+values.get('email'),
        ...(type.value==='student'?['大学：'+values.get('university'),'学年・課程：'+values.get('year')]:[]),'本文：\n'+values.get('message')].join('\n');
      const subject = '【ドイツ留学ラボ】'+purpose;
        const gmailUrl = 'https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to='+encodeURIComponent(recipient)+'&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
        window.location.href = 'https://accounts.google.com/AccountChooser?service=mail&continue='+encodeURIComponent(gmailUrl);
    });
  }
  const bookingPanel = document.getElementById('bookingPanel');
  if (bookingPanel) {
    const select = document.getElementById('bookingStudent');
    students.forEach(s => select.add(new Option(s.name, s.id)));
    if (byId.has(id)) select.value = id;
    const link = document.getElementById('bookingLink'), status = document.getElementById('bookingStatus');
    function update() {
      const s = byId.get(select.value), url = booking(select.value);
      document.getElementById('bookingName').textContent = s.name;
      document.getElementById('bookingUniversity').textContent = s.university + ' / ' + s.major;
      document.getElementById('bookingPhoto').src = 'images/' + s.photo;
      document.getElementById('bookingPhoto').alt = s.name + 'の写真';
      document.getElementById('bookingProfile').href = 'index.html#student-' + s.id;
      document.getElementById('bookingLine').href = 'arrival-support.html?student=' + encodeURIComponent(s.id);
      link.hidden = !url;
      if (url) link.href = url; else link.removeAttribute('href');
      status.textContent = url ? '選択した学生のCalendly予約ページへ進めます。' : s.name + 'さんのZoom予約は現在準備中です。受付開始後、このページから予約できます。';
    }
    select.addEventListener('change', update); update();
  }
  const form = document.getElementById('arrivalForm');
  if (form) {
    const select = document.getElementById('lineStudent'), plan = document.getElementById('linePlan');
    students.forEach(s => select.add(new Option(s.name, s.id)));
    if (byId.has(id)) select.value = id;
    const email = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(config.lineApplicationEmail || '') ? config.lineApplicationEmail : '';
    const external = https(config.lineApplicationUrl);
    const friend = https(config.lineFriendUrl, ['line.me', 'www.line.me', 'lin.ee']);
    document.getElementById('personalFields').disabled = !email;
    document.getElementById('submitApplication').disabled = !email;
    document.getElementById('lineAvailability').textContent = email || external ? '申込先をご確認のうえ、お申し込みください。申込だけではお支払い・相談開始は確定しません。' : 'LINE相談の申込受付は準備中です。現役生・プランとサービス内容はご確認いただけます。';
    const ext = document.getElementById('externalApplication'); ext.hidden = !external;
    if (external) ext.href = external;
    const add = document.getElementById('lineFriend'); add.hidden = !friend;
    if (friend) add.href = friend;
    function update() {
      const s = byId.get(select.value), days = plan.value === '10' ? 10 : 30, amount = days === 10 ? 5000 : 15000;
      document.getElementById('lineSummary').textContent = s.name + 'さん / ' + days + '日間 / ' + amount.toLocaleString('ja-JP') + '円';
      document.getElementById('lineProfileLink').href = 'index.html#student-' + s.id;
    }
    select.addEventListener('change', update); plan.addEventListener('change', update); update();
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!email || !form.reportValidity()) return;
      const values = new FormData(form);
      const body = ['ドイツ留学ラボ LINE相談申込', document.getElementById('lineSummary').textContent,
        'お名前：' + values.get('name'), 'メール：' + values.get('email'), 'LINE表示名：' + values.get('lineName'),
        '相談内容：\n' + values.get('message'), '\n料金・開始日・支払方法・キャンセル条件の案内を希望します。'].join('\n');
      const mailto = 'mailto:' + email + '?subject=' + encodeURIComponent('ドイツ留学ラボ LINE相談申込') + '&body=' + encodeURIComponent(body);
      document.getElementById('mailPreview').value = body;
      const draft = document.getElementById('mailDraft'); draft.href = mailto;
      document.getElementById('mailResult').hidden = false;
      document.getElementById('mailResult').scrollIntoView({behavior:'smooth',block:'center'});
    });
  }
  const columns = (window.GERMANY_COLUMNS || []).filter(c => c.enabled === true);
  document.querySelectorAll('[data-column-list]').forEach(list => {
    const max = list.dataset.columnList === 'recent' ? 3 : columns.length;
    columns.slice().sort((a,b) => b.date.localeCompare(a.date)).slice(0,max).forEach(c => {
      const local = value => typeof value === 'string' && /^(?:images\/)?[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..');
      if (!local(c.url) || !local(c.thumbnail) || !byId.has(c.authorId)) return;
      const article = document.createElement('article'); article.className = 'columnListCard';
      const a = document.createElement('a'); a.className = 'columnCardLink'; a.href = c.url;
      const wrap = document.createElement('div'); wrap.className = 'columnCardImageWrap';
      const img = document.createElement('img'); img.className = 'columnCardImage'; img.src = c.thumbnail; img.alt = c.title; img.loading = 'lazy'; wrap.append(img);
      const body = document.createElement('div'); body.className = 'columnCardBody';
      const meta = document.createElement('div'); meta.className = 'columnCardMeta'; meta.textContent = byId.get(c.authorId).name + ' · ' + byId.get(c.authorId).university + ' · ' + c.date + (c.readingTime ? ' · ' + c.readingTime : '');
      const h = document.createElement('h3'); h.textContent = c.title;
      const p = document.createElement('p'); p.textContent = c.summary;
      const tags = document.createElement('div'); tags.className = 'columnTags';
      (c.tags || []).forEach(t => { const tag = document.createElement('span'); tag.textContent = t; tags.append(tag); });
      const read = document.createElement('div'); read.className = 'readMore'; read.textContent = '記事を読む';
      body.append(meta,h,p,tags,read); a.append(wrap,body); article.append(a); list.append(article);
    });
    if (list.children.length) document.querySelectorAll('[data-column-empty]').forEach(e => e.hidden = true);
  });
})();


// Currency display is shared by all public pages.
{ const script=document.createElement('script');script.src='currency.js?v=20261009-yen';script.defer=true;document.head.append(script); }
