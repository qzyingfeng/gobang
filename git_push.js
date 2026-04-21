const { execSync } = require('child_process');
const process = require('process');

try {
    process.chdir('D:\\WorkSpace\\Creator\\gobang');
    
    console.log('1. Checking status...');
    let status = execSync('git status --short', { encoding: 'utf-8' });
    console.log(status || 'No changes');
    
    if (status.trim()) {
        console.log('2. Adding files...');
        execSync('git add -A', { encoding: 'utf-8' });
        
        console.log('3. Committing...');
        execSync('git commit -m "Update popup and button assets"', { encoding: 'utf-8' });
        
        console.log('4. Pushing to GitHub...');
        execSync('git push origin master', { encoding: 'utf-8' });
        
        console.log('Done! Pushed to GitHub successfully.');
    } else {
        console.log('No changes to commit.');
    }
} catch (e) {
    console.log('Error:', e.message);
}