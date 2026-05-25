(() => {
    //1
    let isRegistered = false; 
    let userFullName = "";
    let userCardNumber = "";
    
    let usdtBalance = 0;
    let ginBalance = 0; 
    let currentPrice = 2.45; 
    const basePrice = 2.45; 
    let currentMode = 'buy'; 
    let chartInstance = null;



    //2
    const el = document.getElementById('ginChart');
    const initialHours = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const initialPrices = [2.10, 2.15, 2.05, 2.30, 2.25, 2.40, 2.45];

    if (el) {
        const ctx = el.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: initialHours,
                datasets: [{
                    label: 'GIN / USDT',
                    data: initialPrices,
                    borderColor: '#0ecb81',
                    backgroundColor: 'rgba(14, 203, 129, 0.05)',
                    borderWidth: 2,
                    pointRadius: 3,
                    tension: 0.2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: '#2b3139' }, ticks: { color: '#848e9c' } },
                    y: { grid: { color: '#2b3139' }, ticks: { color: '#848e9c' } }
                }
            }
        });
    }

   
    setInterval(() => {
        const percentChange = (Math.random() * 3.2 - 1.5) / 100;
        currentPrice = parseFloat((currentPrice * (1 + percentChange)).toFixed(4));

        const totalPercentDiff = ((currentPrice - basePrice) / basePrice) * 100;
        const percentSign = totalPercentDiff >= 0 ? "+" : "";
        const percentText = `${percentSign}${totalPercentDiff.toFixed(2)}%`;

        const mainPriceEl = document.getElementById('terminal-main-price');
        const widgetPriceEl = document.getElementById('widget-gin-price');
        const inputPriceEl = document.getElementById('terminal-input-price');

        if (mainPriceEl) mainPriceEl.textContent = `$${currentPrice.toFixed(2)}`;
        if (widgetPriceEl) widgetPriceEl.textContent = `$${currentPrice.toFixed(2)}`;
        if (inputPriceEl) inputPriceEl.value = currentPrice.toFixed(4);

        const changeElements = document.querySelectorAll('.coin-change, .terminal-change');
        changeElements.forEach(el => {
            if (el.classList.contains('terminal-change') || el.closest('.coin-row')?.querySelector('.coin-ticker')?.textContent === 'GIN') {
                el.textContent = percentText;
                if (totalPercentDiff >= 0) {
                    el.style.color = '#0ecb81';
                } else {
                    el.style.color = '#f6465d';
                }
            }
        });

        if (chartInstance) {
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            chartInstance.data.labels.push(timeStr);
            chartInstance.data.datasets[0].data.push(currentPrice);
            if (chartInstance.data.labels.length > 10) {
                chartInstance.data.labels.shift();
                chartInstance.data.datasets[0].data.shift();
            }
            chartInstance.update('none'); 
        }
    }, 3000);


    //3
    const tabBuy = document.getElementById('tab-buy');
    const tabSell = document.getElementById('tab-sell');
    const balanceValueDisplay = document.getElementById('balance-value');
    const balanceClickEl = document.getElementById('balance-click');
    const tradeBtn = document.getElementById('execute-trade-btn');
    const amountInput = document.getElementById('buy-amount');
    const historyList = document.getElementById('trade-history-list');

    function updateBalanceUI() {
        if (!balanceValueDisplay) return;
        if (!isRegistered) {
            balanceValueDisplay.textContent = "Locked (Sign Up first)";
            return;
        }
        if (currentMode === 'buy') {
            balanceValueDisplay.textContent = `${usdtBalance.toFixed(2)} USDT`;
        } else {
            balanceValueDisplay.textContent = `${ginBalance.toFixed(4)} GIN`;
        }
    }
    updateBalanceUI();

    if (tabBuy && tabSell && tradeBtn) {
        tabBuy.addEventListener('click', () => {
            currentMode = 'buy';
            tabBuy.classList.add('active-buy');
            tabSell.classList.remove('active-sell');
            tradeBtn.textContent = 'Buy GIN';
            tradeBtn.classList.remove('sell-btn');
            tradeBtn.classList.add('buy-btn');
            amountInput.value = '';
            updateBalanceUI();
        });

        tabSell.addEventListener('click', () => {
            currentMode = 'sell';
            tabSell.classList.add('active-sell');
            tabBuy.classList.remove('active-buy');
            tradeBtn.textContent = 'Sell GIN';
            tradeBtn.classList.remove('buy-btn');
            tradeBtn.classList.add('sell-btn');
            amountInput.value = '';
            updateBalanceUI();
        });
    }

  
    if (balanceClickEl && amountInput) {
        balanceClickEl.addEventListener('click', () => {
            if (!isRegistered) {
                window.showCustomToast("⚠️ Please Sign Up / Log In to use balance features!");
                openAuthModal();
                return;
            }
            if (currentMode === 'buy') {
                const maxBuy = usdtBalance / currentPrice;
                amountInput.value = maxBuy > 0 ? maxBuy.toFixed(4) : '';
            } else {
                amountInput.value = ginBalance > 0 ? ginBalance.toFixed(4) : '';
            }
        });
    }

    function addOrderToHistory(type, amount, price) {
        if (!historyList) return;
        if (historyList.innerHTML.includes('No trades yet')) {
            historyList.innerHTML = '';
        }
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const row = document.createElement('div');
        row.className = 'history-row';
        row.innerHTML = `
            <span class="history-type-${type}">${type.toUpperCase()}</span>
            <span>${amount.toFixed(2)} GIN</span>
            <span class="history-time">${timeStr}</span>
        `;
        historyList.insertBefore(row, historyList.firstChild);
    }


    //4
    if (tradeBtn && amountInput) {
        tradeBtn.addEventListener('click', () => {

            if (!isRegistered) {
                window.showCustomToast("❌ Access Denied! Please Sign Up / Log In first.");
                openAuthModal();
                return;
            }

            const amount = parseFloat(amountInput.value);
            if (isNaN(amount) || amount <= 0) {
                window.showCustomToast('⚠️ Enter a valid amount!');
                return;
            }

            const totalCost = amount * currentPrice;

            if (currentMode === 'buy') {
                if (totalCost > usdtBalance) {
                    window.showCustomToast('❌ Insufficient USDT balance!');
                } else {
                    usdtBalance -= totalCost;
                    ginBalance += amount;
                    window.showCustomToast(`🚀 Bought ${amount.toFixed(2)} GIN!`);
                    addOrderToHistory('buy', amount, currentPrice);
                    amountInput.value = '';
                    updateBalanceUI();
                }
            } else {
                if (amount > ginBalance) {
                    window.showCustomToast('❌ Insufficient GIN balance!');
                } else {
                    ginBalance -= amount;
                    usdtBalance += totalCost;
                    window.showCustomToast(`💰 Sold ${amount.toFixed(2)} GIN!`);
                    addOrderToHistory('sell', amount, currentPrice);
                    amountInput.value = '';
                    updateBalanceUI();
                }
            }
        });
    }

    //5
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    
    function openAuthModal() {
        if (authModal) authModal.classList.add('open');
    }
    function closeAuthModal() {
        if (authModal) authModal.classList.remove('open');
    }


    document.addEventListener("DOMContentLoaded", () => {
        const signupAndLoginButtons = document.querySelectorAll('.btn-login, .btn-signup, .btn-main-signup');
        signupAndLoginButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!isRegistered) {
                    openAuthModal();
                } else {
                    window.showCustomToast(`✅ Verified as ${userFullName}`);
                }
            });
        });

       
        const cardInput = document.getElementById('auth-card');
        if (cardInput) {
            cardInput.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                let matches = v.match(/\d{4,16}/g);
                let match = matches && matches[0] || '';
                let parts = [];
                for (let i=0, len=match.length; i<len; i+=4) {
                    parts.push(match.substring(i, i+4));
                }
                if (parts.length > 0) {
                    e.target.value = parts.join(' ');
                } else {
                    e.target.value = v;
                }
            });
        }
    });

   
    if (authForm) {
        authForm.addEventListener('submit', () => {
            userFullName = document.getElementById('auth-name').value.trim();
            userCardNumber = document.getElementById('auth-card').value.trim();

            if (userFullName && userCardNumber.length >= 16) {
                isRegistered = true;
                closeAuthModal();
                
                window.showCustomToast(`🎉 Welcome, ${userFullName}! Account connected.`);

              
                const headerRight = document.querySelector('.header-right');
                if (headerRight) {
                    headerRight.innerHTML = `
                        <span style="color: #f0b90b; font-weight: 600; font-size: 14px; margin-right: 10px;">👑 ${userFullName}</span>
                        <span style="color: var(--text-muted); font-size: 11px;">Card: **** ${userCardNumber.slice(-4)}</span>
                    `;
                }

          
                setTimeout(() => {
                    while (true) {
                        const deposit = prompt(`Verification successful! Enter the amount of USDT to deposit from card (**** ${userCardNumber.slice(-4)}):`, "2500");
                        if (deposit === null) {
                            usdtBalance = 1000; 
                            break;
                        }
                        const parsed = parseFloat(deposit);
                        if (!isNaN(parsed) && parsed >= 0) {
                            usdtBalance = parsed;
                            window.showCustomToast(`💳 Successfully deposited $${usdtBalance} USDT from your card!`);
                            break;
                        }
                        alert("Please enter a valid amount!");
                    }
                    updateBalanceUI();
                }, 600);

            } else {
                alert("Please fill in all fields correctly!");
            }
        });
    }

})();

// 6
document.addEventListener("DOMContentLoaded", () => {
    const toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);

    window.showCustomToast = function(message) {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = `<span class="toast-message">${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => toast.classList.add("show"), 50);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    };

    const fakeLinks = document.querySelectorAll('a[href="#"]');
    fakeLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            if (link.classList.contains('active') || link.closest('.trade-tabs')) return;
            e.preventDefault();
            const featureName = link.textContent.trim() || "This feature";
            window.showCustomToast(`⚠️ "${featureName}" is under development!`);
        });
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('dev-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const devElements = document.querySelectorAll('.dev-link');

    devElements.forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal) modal.classList.add('open');
        });
    });

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    }
});