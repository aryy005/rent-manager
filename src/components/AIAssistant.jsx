import React, { useState, useEffect } from 'react';
import { Sparkles, Bot } from 'lucide-react';

const AIAssistant = ({ rooms, totals }) => {
  const [insight, setInsight] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInsight = () => {
    setIsGenerating(true);
    // Simulate AI processing time
    setTimeout(() => {
      const occupiedRooms = rooms.filter(r => r.isOccupied);
      const occupancyRate = (occupiedRooms.length / rooms.length) * 100;
      
      let highestElectric = occupiedRooms[0];
      let highestWater = occupiedRooms[0];
      
      occupiedRooms.forEach(room => {
        if (room.electric > highestElectric.electric) highestElectric = room;
        if (room.water > highestWater.water) highestWater = room;
      });

      const insights = [
        `Occupancy is currently at ${occupancyRate}%. ${occupancyRate < 100 ? `You have ${rooms.length - occupiedRooms.length} vacant rooms.` : 'Fully booked!'}`,
        `Room ${highestElectric.number} (${highestElectric.tenant}) is consuming the most electricity ($${highestElectric.electric}). Consider checking for inefficient appliances.`,
        `Total revenue this month is $${totals.totalRevenue}. Water and electricity combined cost $${totals.totalElectric + totals.totalWater}.`,
        `Room ${highestWater.number} reported the highest water usage this month. A quick inspection for leaks might be beneficial.`
      ];

      // Pick a random insight
      const randomInsight = insights[Math.floor(Math.random() * insights.length)];
      setInsight(randomInsight);
      setIsGenerating(false);
    }, 1500);
  };

  useEffect(() => {
    generateInsight();
  }, [rooms]); // Regenerate insight when rooms data changes

  return (
    <div className="glass-panel ai-panel">
      <div className="ai-content">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="text-primary" />
            <span className="text-gradient">AI Revenue Insights</span>
          </h2>
          <button 
            onClick={generateInsight} 
            className="btn btn-outline text-sm"
            disabled={isGenerating}
          >
            {isGenerating ? 'Analyzing...' : (
              <>
                <Sparkles size={16} /> Regenerate
              </>
            )}
          </button>
        </div>
        
        <div className="ai-insight animate-fade-in">
          <Sparkles className="text-secondary mt-1 flex-shrink-0" size={20} />
          <p className="text-main leading-relaxed">
            {isGenerating ? 'Analyzing current property metrics...' : insight}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
