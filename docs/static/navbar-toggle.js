// Navbar Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
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
