/**
 * Represents a month and year combination
 */
export interface MonthYear {
    /** The month number (1-12) */
    month: number;
    
    /** The full year (e.g., 2023) */
    year: number;
    
    /** Optional start date for custom date ranges */
    startDate?: string;
    
    /** Optional end date for custom date ranges */
    endDate?: string;
  }