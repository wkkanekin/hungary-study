const universityCalendarData = {
  ELTE: {
    name: "ELTE",
    fullName: "Eötvös Loránd University",
    breakEvents: [
      {
        title: "長期休暇",
        start: "2026-04-01",
        end: "2026-04-07",
        dateText: "2026年4月1日〜2026年4月7日",
        note: "ここにELTEの長期休暇情報を入れます。現役生情報や公式カレンダー確認後に更新してください。",
        progress: 38
      }
    ],
    examEvents: [
      {
        title: "テスト期間",
        start: "2026-05-18",
        end: "2026-07-03",
        dateText: "2026年5月18日〜2026年7月3日",
        note: "ここにELTEの試験期間・再試験期間情報を入れます。学部により異なる場合があります。",
        progress: 72
      }
    ]
  },

  BGE: {
    name: "BGE",
    fullName: "Budapest University of Economics and Business",
    breakEvents: [
      {
        title: "長期休暇",
        start: "",
        end: "",
        dateText: "確認中",
        note: "BGE在籍学生または公式カレンダーから長期休暇情報を確認後に入力します。",
        progress: 20
      }
    ],
    examEvents: [
      {
        title: "テスト期間",
        start: "",
        end: "",
        dateText: "確認中",
        note: "BGEの試験期間・再試験期間を確認後に入力します。",
        progress: 20
      }
    ]
  },

  BME: {
    name: "BME",
    fullName: "Budapest University of Technology and Economics",
    breakEvents: [
      {
        title: "長期休暇",
        start: "",
        end: "",
        dateText: "確認中",
        note: "BME在籍学生または公式カレンダーから長期休暇情報を確認後に入力します。",
        progress: 20
      }
    ],
    examEvents: [
      {
        title: "テスト期間",
        start: "",
        end: "",
        dateText: "確認中",
        note: "BMEは学部や科目によって試験負担が異なるため、現役生情報も確認予定です。",
        progress: 20
      }
    ]
  },

  Corvinus: {
    name: "Corvinus",
    fullName: "Corvinus University of Budapest",
    breakEvents: [
      {
        title: "長期休暇",
        start: "",
        end: "",
        dateText: "確認中",
        note: "Corvinus在籍学生または公式カレンダーから長期休暇情報を確認後に入力します。",
        progress: 20
      }
    ],
    examEvents: [
      {
        title: "テスト期間",
        start: "",
        end: "",
        dateText: "確認中",
        note: "Corvinusの試験期間・再試験期間を確認後に入力します。",
        progress: 20
      }
    ]
  },

  Debrecen: {
    name: "Debrecen",
    fullName: "University of Debrecen",
    breakEvents: [
      {
        title: "長期休暇",
        start: "",
        end: "",
        dateText: "確認中",
        note: "University of Debrecen在籍学生または公式カレンダーから長期休暇情報を確認後に入力します。",
        progress: 20
      }
    ],
    examEvents: [
      {
        title: "テスト期間",
        start: "",
        end: "",
        dateText: "確認中",
        note: "University of Debrecenの試験期間・再試験期間を確認後に入力します。",
        progress: 20
      }
    ]
  },

  Szeged: {
    name: "Szeged",
    fullName: "University of Szeged",
    breakEvents: [
      {
        title: "長期休暇",
        start: "2026-04-02",
        end: "2026-04-07",
        dateText: "2026年4月2日〜2026年4月7日",
        note: "ここにUniversity of Szegedの長期休暇情報を入れます。年度や学部により異なる場合があります。",
        progress: 34
      }
    ],
    examEvents: [
      {
        title: "テスト期間",
        start: "",
        end: "",
        dateText: "確認中",
        note: "University of Szegedの試験期間・再試験期間を確認後に入力します。",
        progress: 20
      }
    ]
  },

  Pecs: {
    name: "Pécs",
    fullName: "University of Pécs",
    breakEvents: [
      {
        title: "長期休暇",
        start: "",
        end: "",
        dateText: "確認中",
        note: "University of Pécs在籍学生または公式カレンダーから長期休暇情報を確認後に入力します。",
        progress: 20
      }
    ],
    examEvents: [
      {
        title: "テスト期間",
        start: "",
        end: "",
        dateText: "確認中",
        note: "University of Pécsの試験期間・再試験期間を確認後に入力します。",
        progress: 20
      }
    ]
  },

  Szechenyi: {
    name: "Széchenyi",
    fullName: "Széchenyi István University",
    breakEvents: [
      {
        title: "長期休暇",
        start: "",
        end: "",
        dateText: "確認中",
        note: "Széchenyi István University在籍学生または公式カレンダーから長期休暇情報を確認後に入力します。",
        progress: 20
      }
    ],
    examEvents: [
      {
        title: "テスト期間",
        start: "",
        end: "",
        dateText: "確認中",
        note: "Széchenyi István Universityの試験期間・再試験期間を確認後に入力します。",
        progress: 20
      }
    ]
  },

  IBS: {
    name: "IBS",
    fullName: "International Business School, Budapest",
    breakEvents: [
      {
        title: "長期休暇",
        start: "",
        end: "",
        dateText: "確認中",
        note: "IBS在籍学生または公式カレンダーから長期休暇情報を確認後に入力します。",
        progress: 20
      }
    ],
    examEvents: [
      {
        title: "テスト期間",
        start: "",
        end: "",
        dateText: "確認中",
        note: "IBSの試験期間・再試験期間を確認後に入力します。",
        progress: 20
      }
    ]
  }
};

const selectedUniversities = [];

let currentMode = "break";

const selectedUniversitiesElement = document.getElementById("selectedUniversities");
const calendarResultElement = document.getElementById("calendarResult");
const modeButtons = document.querySelectorAll(".modeBtn");
const universityButtons = document.querySelectorAll(".uniBtn");

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    modeButtons.forEach((modeButton) => {
      modeButton.classList.remove("active");
    });

    button.classList.add("active");

    currentMode = button.dataset.mode;

    renderCalendar();
  });
});

universityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const university = button.dataset.university;

    if (!universityCalendarData[university]) {
      return;
    }

    if (selectedUniversities.includes(university)) {
      return;
    }

    selectedUniversities.push(university);

    renderSelectedUniversities();
    updateUniversityButtonState();
    renderCalendar();
  });
});

function renderSelectedUniversities() {
  selectedUniversitiesElement.innerHTML = "";

  if (selectedUniversities.length === 0) {
    selectedUniversitiesElement.innerHTML = `
      <div class="emptyCalendarMessage">
        まだ大学が選択されていません。
      </div>
    `;
    return;
  }

  selectedUniversities.forEach((university) => {
    const universityData = universityCalendarData[university];

    const tag = document.createElement("div");
    tag.className = "selectedTag";

    tag.innerHTML = `
      <span>${universityData.name}</span>
      <span class="removeTag" data-university="${university}" aria-label="${universityData.name}を削除">×</span>
    `;

    selectedUniversitiesElement.appendChild(tag);
  });

  attachRemoveEvents();
}

function attachRemoveEvents() {
  const removeButtons = document.querySelectorAll(".removeTag");

  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const university = button.dataset.university;
      const index = selectedUniversities.indexOf(university);

      if (index > -1) {
        selectedUniversities.splice(index, 1);
      }

      renderSelectedUniversities();
      updateUniversityButtonState();
      renderCalendar();
    });
  });
}

function updateUniversityButtonState() {
  universityButtons.forEach((button) => {
    const university = button.dataset.university;

    if (selectedUniversities.includes(university)) {
      button.classList.add("isSelected");
      button.textContent = `${universityCalendarData[university].name} 選択中`;
    } else {
      button.classList.remove("isSelected");
      button.textContent = `${universityCalendarData[university].name} ＋`;
    }
  });
}

function renderCalendar() {
  if (selectedUniversities.length === 0) {
    calendarResultElement.innerHTML = `
      <div class="emptyCalendarMessage">
        大学を選択すると、ここに結果が表示されます。
      </div>
    `;
    return;
  }

  const modeLabel = currentMode === "break" ? "長期休暇" : "テスト期間";
  const eventKey = currentMode === "break" ? "breakEvents" : "examEvents";

  let html = `
    <div class="calendarCards">
  `;

  selectedUniversities.forEach((university) => {
    const universityData = universityCalendarData[university];
    const events = universityData[eventKey];

    html += `
      <div class="calendarCard">
        <div class="calendarCardHeader">
          <div>
            <h3 class="calendarUniversity">${universityData.name}</h3>
            <div class="calendarSource">${universityData.fullName}</div>
          </div>
          <span class="calendarBadge">${modeLabel}</span>
        </div>

        <div class="calendarEventList">
    `;

    events.forEach((event) => {
      html += `
        <div class="calendarEvent">
          <h4 class="calendarEventTitle">${event.title}</h4>
          <div class="calendarEventDate">${event.dateText}</div>
          <div class="calendarTimeline">
            <div class="calendarTimelineBar" style="width:${event.progress}%;"></div>
          </div>
          <div class="calendarEventNote">${event.note}</div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += `
    </div>

    <div class="calendarNotice">
      <p>
        ※大学・学部・年度によって日程が異なる場合があります。正式な日程は各大学の公式カレンダーを確認してください。
        このページでは、公式情報と現役生情報をもとに随時更新していきます。
      </p>
    </div>
  `;

  calendarResultElement.innerHTML = html;
}

renderSelectedUniversities();
updateUniversityButtonState();
renderCalendar();