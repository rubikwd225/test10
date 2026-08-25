import { db } from "./firebase.js";

import {
    collection,
    onSnapshot,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


// ========================================
// HTML
// ========================================

const ticketList =
    document.getElementById("ticketList");

const loading =
    document.getElementById("loading");

const dayRadios =
    document.querySelectorAll(
        'input[name="day"]'
    );


// ========================================
// 変数
// ========================================

let collectionName =
    "tickets_day1";

let unsubscribe = null;


// ========================================
// 日付変更
// ========================================

dayRadios.forEach(radio => {

    radio.addEventListener(
        "change",
        () => {

            collectionName =
                radio.value;

            startRealtimeListener();

        }
    );

});


// ========================================
// 初期読み込み
// ========================================

startRealtimeListener();


// ========================================
// リアルタイム監視開始
// ========================================

function startRealtimeListener() {

    // 前の監視を停止

    if (unsubscribe) {

        unsubscribe();

        unsubscribe = null;

    }


    ticketList.innerHTML = "";

    loading.style.display = "block";


    const ticketsRef =
        collection(
            db,
            collectionName
        );


    unsubscribe =
        onSnapshot(

            ticketsRef,

            snapshot => {

                const tickets = [];


                snapshot.forEach(ticketDoc => {

                    const data =
                        ticketDoc.data();


                    tickets.push({

                        id: ticketDoc.id,

                        number:
                            data.number ??
                            ticketDoc.id,

                        status:
                            data.status ??
                            "waiting"

                    });

                });


                // ==============================
                // 整理券番号順
                // ==============================

                tickets.sort(
                    (a, b) => {

                        const numberA =
                            Number(a.number);

                        const numberB =
                            Number(b.number);


                        if (
                            !isNaN(numberA) &&
                            !isNaN(numberB)
                        ) {

                            return numberA - numberB;

                        }


                        return String(a.number)
                            .localeCompare(
                                String(b.number),
                                "ja"
                            );

                    }
                );


                loading.style.display = "none";


                // ==============================
                // チケットなし
                // ==============================

                if (tickets.length === 0) {

                    ticketList.innerHTML = `

                        <div class="error">

                            チケットがありません。

                        </div>

                    `;

                    return;

                }


                // ==============================
                // 一覧更新
                // ==============================

                renderTickets(tickets);

            },

            error => {

                console.error(
                    "Firestore監視エラー:",
                    error
                );


                loading.style.display = "none";


                ticketList.innerHTML = `

                    <div class="error">

                        チケットの読み込みに
                        失敗しました。

                    </div>

                `;

            }

        );

}


// ========================================
// チケット一覧表示
// ========================================

function renderTickets(tickets) {

    ticketList.innerHTML = "";


    tickets.forEach(ticket => {

        createTicketElement(ticket);

    });

}


// ========================================
// チケット表示
// ========================================

function createTicketElement(ticket) {

    const element =
        document.createElement("div");


    element.className = "ticket";


    const statusText =
        getStatusText(ticket.status);


    const statusClass =
        getStatusClass(ticket.status);


    element.innerHTML = `

        <div class="ticket-info">

            <div class="ticket-number">

                No.${ticket.number}

            </div>

            <div class="ticket-id">

                ID: ${ticket.id}

            </div>

            <div
                class="ticket-status ${statusClass}"
            >

                ${statusText}

            </div>

        </div>


        <select class="status-select">

            <option
                value="waiting"
                ${ticket.status === "waiting" ? "selected" : ""}
            >
                受付前
            </option>

            <option
                value="accepted"
                ${ticket.status === "accepted" ? "selected" : ""}
            >
                受付済み
            </option>

            <option
                value="entered"
                ${ticket.status === "entered" ? "selected" : ""}
            >
                入場済み
            </option>

        </select>

    `;


    const select =
        element.querySelector(
            ".status-select"
        );


    const statusElement =
        element.querySelector(
            ".ticket-status"
        );


    // ====================================
    // ステータス変更
    // ====================================

    select.addEventListener(
        "change",
        async () => {

            const newStatus =
                select.value;


            select.classList.add(
                "updating"
            );


            try {

                const ticketRef =
                    doc(
                        db,
                        collectionName,
                        ticket.id
                    );


                await updateDoc(

                    ticketRef,

                    {
                        status: newStatus
                    }

                );


                // Firebaseの変更を待たずに
                // 一旦画面にも反映

                statusElement.textContent =
                    getStatusText(newStatus);


                statusElement.className =
                    "ticket-status " +
                    getStatusClass(newStatus);


                select.classList.remove(
                    "updating"
                );

            }

            catch (error) {

                console.error(error);


                alert(
                    "ステータスの変更に失敗しました。"
                );


                select.value =
                    ticket.status;


                select.classList.remove(
                    "updating"
                );

            }

        }
    );


    ticketList.appendChild(element);

}


// ========================================
// ステータス名
// ========================================

function getStatusText(status) {

    switch (status) {

        case "waiting":

            return "受付前";


        case "accepted":

            return "受付済み";


        case "entered":

            return "入場済み";


        default:

            return "不明";

    }

}


// ========================================
// ステータスCSS
// ========================================

function getStatusClass(status) {

    switch (status) {

        case "waiting":

            return "status-waiting";


        case "accepted":

            return "status-accepted";


        case "entered":

            return "status-entered";


        default:

            return "";

    }

}