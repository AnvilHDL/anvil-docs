// Navbar Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create the toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'navbar-toggle-btn';
    toggleBtn.innerHTML = '☰';
    toggleBtn.title = 'Hide Navigation';
    toggleBtn.setAttribute('aria-label', 'Toggle Navigation');
    
    document.body.appendChild(toggleBtn);
    
    // Check for saved preference
    const navHidden = localStorage.getItem('navHidden') === 'true';
    if (navHidden) {
        document.body.classList.add('nav-hidden');
        toggleBtn.innerHTML = '☰';
    } else {
        toggleBtn.innerHTML = '—';
    }
    
    // Toggle handler
    toggleBtn.addEventListener('click', function() {
        document.body.classList.toggle('nav-hidden');
        const isHidden = document.body.classList.contains('nav-hidden');
        
        // Update button icon
        toggleBtn.innerHTML = isHidden ? '☰' : '—';
        
        // Save preference
        localStorage.setItem('navHidden', isHidden);
    });
});
