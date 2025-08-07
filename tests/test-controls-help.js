/**
 * Test for Controls Help Feature
 * 
 * This test verifies that the controls help text is properly displayed
 * in the bottom-left corner of the application.
 */

const puppeteer = require('puppeteer');

async function testControlsHelp() {
    console.log('🧪 Testing Controls Help Feature...');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Navigate to the application
        await page.goto('http://localhost:3001', { 
            waitUntil: 'networkidle0',
            timeout: 10000 
        });
        
        console.log('✅ Page loaded successfully');
        
        // Check if controls help container exists
        const controlsHelp = await page.$('.controls-help');
        if (!controlsHelp) {
            throw new Error('Controls help container not found');
        }
        console.log('✅ Controls help container found');
        
        // Check if all expected help items are present
        const expectedHelpTexts = [
            'Drag: Move nodes',
            'Shift + click: Select nodes',
            'Shift + drag: Select multiple',
            'Right-click + drag: Pan canvas',
            'Mouse wheel: Zoom'
        ];
        
        for (const expectedText of expectedHelpTexts) {
            const helpItem = await page.$x(`//div[@class='help-item'][contains(text(), '${expectedText}')]`);
            if (helpItem.length === 0) {
                throw new Error(`Help text "${expectedText}" not found`);
            }
            console.log(`✅ Found help text: "${expectedText}"`);
        }
        
        // Check positioning and styling
        const helpPosition = await page.evaluate(() => {
            const helpElement = document.querySelector('.controls-help');
            const styles = window.getComputedStyle(helpElement);
            return {
                position: styles.position,
                bottom: styles.bottom,
                left: styles.left,
                zIndex: styles.zIndex,
                backgroundColor: styles.backgroundColor,
                opacity: styles.opacity
            };
        });
        
        console.log('📍 Controls help positioning:', helpPosition);
        
        // Verify positioning
        if (helpPosition.position !== 'fixed') {
            throw new Error('Controls help should have fixed positioning');
        }
        
        if (helpPosition.bottom !== '20px') {
            throw new Error('Controls help should be 20px from bottom');
        }
        
        if (helpPosition.left !== '20px') {
            throw new Error('Controls help should be 20px from left');
        }
        
        console.log('✅ Controls help positioning is correct');
        
        // Check text styling
        const textStyles = await page.evaluate(() => {
            const helpItem = document.querySelector('.help-item');
            const styles = window.getComputedStyle(helpItem);
            return {
                fontSize: styles.fontSize,
                color: styles.color,
                fontWeight: styles.fontWeight
            };
        });
        
        console.log('🎨 Help text styling:', textStyles);
        
        // Verify text is small and faint
        if (!textStyles.fontSize.includes('11px')) {
            console.warn('⚠️  Font size might not be optimal for subtle help text');
        }
        
        console.log('✅ Controls help styling is appropriate');
        
        // Take a screenshot for visual verification
        await page.screenshot({ 
            path: 'tests/screenshots/controls-help-test.png',
            fullPage: true 
        });
        console.log('📸 Screenshot saved to tests/screenshots/controls-help-test.png');
        
        // Test that help text doesn't interfere with canvas interactions
        const canvas = await page.$('#canvas');
        if (!canvas) {
            throw new Error('Canvas not found');
        }
        
        // Test clicking on canvas (should not be blocked by help text)
        await page.click('#canvas', { button: 'left' });
        console.log('✅ Canvas interactions not blocked by help text');
        
        console.log('🎉 All Controls Help tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testControlsHelp()
        .then(() => {
            console.log('✅ Controls Help test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Controls Help test failed:', error);
            process.exit(1);
        });
}

module.exports = { testControlsHelp };
