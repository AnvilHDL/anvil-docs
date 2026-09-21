// Navbar Toggle Functionality
const anvilStaticUrl = new URL('.', document.currentScript.src);

document.addEventListener('DOMContentLoaded', function() {
    const quickLinksNav = document.createElement('nav');
    quickLinksNav.className = 'quick-links-navbar';
    quickLinksNav.innerHTML = `
        <a href="https://github.com/kisp-nus/anvil" target="_blank" title="Anvil Compiler">
            <img class="quicklink-icon" src="${new URL('github-mark.svg', anvilStaticUrl).href}" alt="GitHub" />
        </a>
        <a href="https://anvil.kisp-lab.org/" target="_blank" title="AnvilHDL Playground">
            <img class="quicklink-icon" src="${new URL('terminal-logo.svg', anvilStaticUrl).href}" alt="Playground" " />
        </a>

        <a href="https://arxiv.org/abs/2503.19447" target="_blank" title="Research Paper">
            <img class="quicklink-icon" src="${new URL('arxiv-logo.svg', anvilStaticUrl).href}" alt="Paper" />
        </a>
        <a href="https://anvilhdl.zulipchat.com/" target="_blank" title="Community Chat">
            <img class="quicklink-icon" src="https://cdnjs.cloudflare.com/ajax/libs/simple-icons/9.0.0/zulip.svg" alt="Chat";" />
        </a>
    `;
    
    document.body.appendChild(quickLinksNav);


    const menuNav = document.querySelector('.wy-menu.wy-menu-vertical');
    if (menuNav) {
        const sidebarLinks = document.createElement('div');
        sidebarLinks.className = 'toctree-wrapper compound';
        sidebarLinks.innerHTML = `
            <p class="caption" role="heading"><span class="caption-text">Quick Links</span></p>
            <ul>
                <li class="toctree-l1"><a class="reference external" href="https://arxiv.org/abs/2503.19447" target="_blank">1. Research Paper</a></li>
                <li class="toctree-l1"><a class="reference external" href="https://anvil.kisp-lab.org/" target="_blank">2. AnvilHDL Playground</a></li>
                <li class="toctree-l1"><a class="reference external" href="https://github.com/kisp-nus/anvil" target="_blank">3. Anvil Compiler</a></li>
                <li class="toctree-l1"><a class="reference external" href="https://anvilhdl.zulipchat.com/" target="_blank">4. Community Chat</a></li>
            </ul>
        `;
        menuNav.insertBefore(sidebarLinks, menuNav.firstChild);
    }

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'navbar-toggle-btn';
    toggleBtn.innerHTML = '☰';
    toggleBtn.title = 'Hide Navigation';
    toggleBtn.setAttribute('aria-label', 'Toggle Navigation');
    
    document.body.appendChild(toggleBtn);
    

    if (window.innerWidth > 768) {
        const navHidden = localStorage.getItem('navHidden') === 'true';
        if (navHidden) {
            document.body.classList.add('nav-hidden');
            toggleBtn.innerHTML = '☰';
        } else {
            toggleBtn.innerHTML = '—';
        }
    }
    
    function handleToggle(e) {
        e.preventDefault();
        e.stopPropagation();
        

        if (window.innerWidth <= 768) return;
        
        document.body.classList.toggle('nav-hidden');
        const isHidden = document.body.classList.contains('nav-hidden');
        
        // Update button icon
        toggleBtn.innerHTML = isHidden ? '☰' : '—';
        
        // Save preference
        localStorage.setItem('navHidden', isHidden);
    }
    
    toggleBtn.addEventListener('click', handleToggle);
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            document.body.classList.remove('nav-hidden');
            toggleBtn.innerHTML = '☰';
        } else {
            // Restore saved preference on desktop
            const navHidden = localStorage.getItem('navHidden') === 'true';
            if (navHidden) {
                document.body.classList.add('nav-hidden');
                toggleBtn.innerHTML = '☰';
            } else {
                toggleBtn.innerHTML = '—';
            }
        }
    });
});
