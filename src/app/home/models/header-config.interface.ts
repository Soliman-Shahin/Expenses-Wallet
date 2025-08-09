/**
 * Configuration for the application header
 */
export interface HeaderConfig {
    /** The title to display in the header */
    title: string;
    
    /** The icon to display in the header */
    icon: string;
    
    /** Optional subtitle to display below the title */
    subtitle?: string;
    
    /** Whether to show the back button */
    showBackButton?: boolean;
    
    /** Custom action buttons to display in the header */
    buttons?: HeaderButton[];
  }
  
  /**
   * Represents a button in the header
   */
  export interface HeaderButton {
    /** The button text */
    text: string;
    
    /** The button icon */
    icon: string;
    
    /** The action to perform when clicked */
    handler: () => void;
    
    /** Optional button color */
    color?: string;
    
    /** Optional CSS class */
    cssClass?: string;
  }